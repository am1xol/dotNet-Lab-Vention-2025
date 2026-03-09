using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using SubscriptionManager.Core;
using SubscriptionManager.Core.DTOs;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Models;
using SubscriptionManager.Subscriptions.Infrastructure.Services;
using System.Data;
using System.Security.Claims;

namespace SubscriptionManager.Subscriptions.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UserSubscriptionsController : ControllerBase
    {
        private readonly string _connectionString;
        private readonly IFileStorageService _fileStorageService;
        private readonly IPaymentGatewayService _paymentGateway;
        private readonly INotificationService _notificationService;

        public UserSubscriptionsController(
            IConfiguration configuration,
            IFileStorageService fileStorageService,
            IPaymentGatewayService paymentGateway,
            INotificationService notificationService)
        {
            _connectionString = configuration.GetConnectionString("SubscriptionsConnection")
                ?? throw new InvalidOperationException("Connection string 'SubscriptionsConnection' not found.");
            _fileStorageService = fileStorageService;
            _paymentGateway = paymentGateway;
            _notificationService = notificationService;
        }

        [HttpPost("initiate-payment/{subscriptionId}")]
        [ProducesResponseType(typeof(PaymentInitiationResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<PaymentInitiationResult>> InitiateSubscriptionPayment([FromRoute] Guid subscriptionId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized();

            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            using var transaction = await connection.BeginTransactionAsync();

            try
            {
                const string getSubSql = "sp_Subscriptions_GetById";
                var subscription = await connection.QueryFirstOrDefaultAsync<Subscription>(
                    getSubSql,
                    new { Id = subscriptionId },
                    transaction,
                    commandType: CommandType.StoredProcedure);

                if (subscription == null || !subscription.IsActive)
                {
                    await transaction.RollbackAsync();
                    return NotFound("Subscription not found");
                }

                const string checkExistingSql = @"
                    SELECT COUNT(1) FROM UserSubscriptions 
                    WHERE UserId = @UserId AND SubscriptionId = @SubscriptionId AND IsActive = 1";
                var existingCount = await connection.ExecuteScalarAsync<int>(
                    checkExistingSql,
                    new { UserId = userId, SubscriptionId = subscriptionId },
                    transaction);

                if (existingCount > 0)
                {
                    await transaction.RollbackAsync();
                    return BadRequest("User already subscribed");
                }

                var userSubscription = new UserSubscription
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    SubscriptionId = subscriptionId,
                    StartDate = DateTime.UtcNow,
                    NextBillingDate = CalculateNextBillingDate(subscription.Period),
                    IsActive = false
                };

                const string insertUserSubSql = "sp_UserSubscriptions_Insert";
                await connection.ExecuteAsync(
                    insertUserSubSql,
                    new
                    {
                        userSubscription.Id,
                        userSubscription.UserId,
                        userSubscription.SubscriptionId,
                        userSubscription.StartDate,
                        userSubscription.NextBillingDate,
                        userSubscription.IsActive
                    },
                    transaction,
                    commandType: CommandType.StoredProcedure);

                var payment = new Payment
                {
                    Id = Guid.NewGuid(),
                    UserSubscriptionId = userSubscription.Id,
                    UserId = userId,
                    Amount = subscription.Price,
                    Currency = "BYN",
                    PaymentDate = DateTime.UtcNow,
                    Status = PaymentStatus.Pending,
                    PeriodStart = userSubscription.StartDate,
                    PeriodEnd = userSubscription.NextBillingDate
                };

                const string insertPaymentSql = "sp_Payments_Insert";
                await connection.ExecuteAsync(
                    insertPaymentSql,
                    new
                    {
                        payment.Id,
                        payment.UserSubscriptionId,
                        payment.UserId,
                        payment.Amount,
                        payment.Currency,
                        ExternalTransactionId = (string?)null,
                        Status = (int)payment.Status,
                        payment.PeriodStart,
                        payment.PeriodEnd
                    },
                    transaction,
                    commandType: CommandType.StoredProcedure);

                await transaction.CommitAsync();

                var userEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "customer@example.com";
                var expirationDate = DateTime.UtcNow.AddMinutes(30);

                var paymentResult = await _paymentGateway.InitiatePaymentAsync(
                    subscription.Price,
                    "BYN",
                    $"Subscription: {subscription.Name}",
                    payment.Id.ToString(),
                    userEmail,
                    expirationDate
                );

                return Ok(paymentResult);
            }
            catch (ArgumentException ex)
            {
                await transaction.RollbackAsync();
                return BadRequest($"Payment initiation failed: {ex.Message}");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("statistics")]
        [ProducesResponseType(typeof(UserStatisticsDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<UserStatisticsDto>> GetUserStatistics()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized("Invalid user ID in token");

            using var connection = new SqlConnection(_connectionString);

            const string statsSql = "sp_UserStatistics_Get";
            var stats = await connection.QueryFirstOrDefaultAsync<UserStatisticsDto>(
                statsSql,
                new { UserId = userId },
                commandType: CommandType.StoredProcedure) ?? new UserStatisticsDto();

            const string recentProc = "sp_GetRecentPayments";
            var recentPayments = await connection.QueryAsync<Payment, Subscription, PaymentDto>(
                recentProc,
                (p, sub) => new PaymentDto
                {
                    Id = p.Id,
                    UserSubscriptionId = p.UserSubscriptionId,
                    Amount = p.Amount,
                    Currency = p.Currency,
                    PaymentDate = p.PaymentDate,
                    PeriodStart = p.PeriodStart,
                    PeriodEnd = p.PeriodEnd,
                    Status = p.Status.ToString(),
                    CardLastFour = p.CardLastFour,
                    CardBrand = p.CardBrand,
                    Subscription = new SubscriptionDto
                    {
                        Id = sub.Id,
                        Name = sub.Name,
                        Price = sub.Price
                    }
                },
                new { UserId = userId },
                splitOn: "Id",
                commandType: CommandType.StoredProcedure);

            const string upcomingProc = "sp_GetUpcomingPayments";
            var upcomingPayments = await connection.QueryAsync<UpcomingPaymentDto>(
                upcomingProc,
                new { UserId = userId },
                commandType: CommandType.StoredProcedure);

            stats.RecentPayments = recentPayments.ToList();
            stats.UpcomingPayments = upcomingPayments.ToList();
            stats.NextBillingDate = upcomingPayments.FirstOrDefault()?.NextBillingDate;

            return Ok(stats);
        }

        [HttpGet("payment-history")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        public async Task<ActionResult> GetPaymentHistory([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 5)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized("Invalid user ID in token");

            using var connection = new SqlConnection(_connectionString);

            const string historyProc = "sp_Payments_GetHistoryPaged";
            var parameters = new DynamicParameters();
            parameters.Add("@UserId", userId);
            parameters.Add("@PageNumber", pageNumber);
            parameters.Add("@PageSize", pageSize);
            parameters.Add("@TotalCount", dbType: DbType.Int32, direction: ParameterDirection.Output);

            var payments = await connection.QueryAsync<Payment, Subscription, PaymentDto>(
                historyProc,
                (p, sub) => new PaymentDto
                {
                    Id = p.Id,
                    UserSubscriptionId = p.UserSubscriptionId,
                    Amount = p.Amount,
                    Currency = p.Currency,
                    PaymentDate = p.PaymentDate,
                    PeriodStart = p.PeriodStart,
                    PeriodEnd = p.PeriodEnd,
                    Status = p.Status.ToString(),
                    CardLastFour = p.CardLastFour,
                    CardBrand = p.CardBrand,
                    Subscription = new SubscriptionDto
                    {
                        Id = sub.Id,
                        Name = sub.Name,
                        Price = sub.Price,
                        Period = sub.Period
                    }
                },
                parameters,
                splitOn: "Id",
                commandType: CommandType.StoredProcedure);

            var totalCount = parameters.Get<int>("@TotalCount");

            return Ok(new
            {
                items = payments,
                totalCount,
                pageNumber,
                pageSize
            });
        }

        [HttpPost("subscribe/{subscriptionId}")]
        [ProducesResponseType(typeof(SubscribeResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<SubscribeResponse>> Subscribe(Guid subscriptionId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized("Invalid user ID in token");

            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            using var transaction = await connection.BeginTransactionAsync();

            const string getSubSql = "sp_Subscriptions_GetById";
            var subscription = await connection.QueryFirstOrDefaultAsync<Subscription>(
                getSubSql,
                new { Id = subscriptionId },
                transaction,
                commandType: CommandType.StoredProcedure);

            if (subscription == null || !subscription.IsActive)
            {
                await transaction.RollbackAsync();
                return NotFound("Subscription not found");
            }

            const string checkExistingSql = @"
                SELECT COUNT(1) FROM UserSubscriptions 
                WHERE UserId = @UserId AND SubscriptionId = @SubscriptionId AND IsActive = 1";
            var existing = await connection.ExecuteScalarAsync<int>(
                checkExistingSql,
                new { UserId = userId, SubscriptionId = subscriptionId },
                transaction);

            if (existing > 0)
            {
                await transaction.RollbackAsync();
                return BadRequest("User already subscribed to this service");
            }

            var userSubscription = new UserSubscription
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                SubscriptionId = subscriptionId,
                StartDate = DateTime.UtcNow,
                NextBillingDate = CalculateNextBillingDate(subscription.Period),
                IsActive = true
            };

            const string insertSql = "sp_UserSubscriptions_Insert";
            await connection.ExecuteAsync(
                insertSql,
                new
                {
                    userSubscription.Id,
                    userSubscription.UserId,
                    userSubscription.SubscriptionId,
                    userSubscription.StartDate,
                    userSubscription.NextBillingDate,
                    userSubscription.IsActive
                },
                transaction,
                commandType: CommandType.StoredProcedure);

            await transaction.CommitAsync();

            return Ok(new SubscribeResponse
            {
                Id = userSubscription.Id,
                UserId = userSubscription.UserId,
                SubscriptionId = userSubscription.SubscriptionId,
                StartDate = userSubscription.StartDate,
                NextBillingDate = userSubscription.NextBillingDate,
                IsActive = userSubscription.IsActive
            });
        }

        [HttpGet("my-subscriptions")]
        public async Task<ActionResult<PagedResult<UserSubscriptionDto>>> GetMySubscriptions(
            [FromQuery] PaginationParams pq,
            [FromQuery] string? category = null)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized();

            using var connection = new SqlConnection(_connectionString);
            const string sql = "sp_UserSubscriptions_GetActiveByUserIdPaged";
            var parameters = new DynamicParameters();
            parameters.Add("@UserId", userId);
            parameters.Add("@PageNumber", pq.PageNumber);
            parameters.Add("@PageSize", pq.PageSize);
            parameters.Add("@Category", category);
            parameters.Add("@TotalCount", dbType: DbType.Int32, direction: ParameterDirection.Output);

            var userSubscriptions = await connection.QueryAsync<UserSubscription, Subscription, UserSubscriptionDto>(
                sql,
                (us, sub) => new UserSubscriptionDto
                {
                    Id = us.Id,
                    UserId = us.UserId,
                    SubscriptionId = us.SubscriptionId,
                    StartDate = us.StartDate,
                    NextBillingDate = us.NextBillingDate,
                    CancelledAt = us.CancelledAt,
                    ValidUntil = us.ValidUntil,
                    IsActive = us.IsActive,
                    Subscription = new SubscriptionDto
                    {
                        Id = sub.Id,
                        Name = sub.Name,
                        Description = sub.Description,
                        Price = sub.Price,
                        Period = sub.Period,
                        Category = sub.Category,
                        IconFileId = sub.IconFileId,
                        IsActive = sub.IsActive
                    }
                },
                parameters,
                splitOn: "Id",
                commandType: CommandType.StoredProcedure);

            var totalCount = parameters.Get<int>("@TotalCount");
            var dtos = userSubscriptions.ToList();

            foreach (var dto in dtos)
            {
                if (dto.Subscription.IconFileId.HasValue)
                {
                    dto.Subscription.IconUrl = await _fileStorageService.GetPresignedUrlAsync(dto.Subscription.IconFileId.Value);
                }
            }

            return Ok(new PagedResult<UserSubscriptionDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = pq.PageNumber,
                PageSize = pq.PageSize
            });
        }

        [HttpPost("unsubscribe/{subscriptionId}")]
        public async Task<IActionResult> Unsubscribe(Guid subscriptionId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized("Invalid user ID in token");

            using var connection = new SqlConnection(_connectionString);

            const string findSql = @"
                SELECT Id, NextBillingDate FROM UserSubscriptions 
                WHERE UserId = @UserId AND SubscriptionId = @SubscriptionId AND IsActive = 1";
            var userSub = await connection.QueryFirstOrDefaultAsync(findSql, new { UserId = userId, SubscriptionId = subscriptionId });

            if (userSub == null)
                return NotFound("Subscription not found");

            var now = DateTime.UtcNow;
            const string updateSql = "sp_UserSubscriptions_Update";
            await connection.ExecuteAsync(updateSql, new
            {
                Id = userSub.Id,
                CancelledAt = now,
                ValidUntil = userSub.NextBillingDate,
                NextBillingDate = (DateTime?)null,
                IsActive = (bool?)null
            }, commandType: CommandType.StoredProcedure);

            return Ok(new
            {
                Message = "Subscription cancelled successfully",
                ValidUntil = userSub.NextBillingDate
            });
        }

        [HttpPost("admin/expire/{userSubscriptionId}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> AdminExpireSubscription(Guid userSubscriptionId)
        {
            using var connection = new SqlConnection(_connectionString);

            const string findSql = @"
                SELECT us.*, s.Name AS SubscriptionName 
                FROM UserSubscriptions us
                INNER JOIN Subscriptions s ON us.SubscriptionId = s.Id
                WHERE us.Id = @Id";
            var userSub = await connection.QueryFirstOrDefaultAsync(findSql, new { Id = userSubscriptionId });

            if (userSub == null)
                return NotFound("User subscription not found");

            var now = DateTime.UtcNow;
            const string expireSql = "sp_UserSubscriptions_Update";
            await connection.ExecuteAsync(expireSql, new
            {
                Id = userSubscriptionId,
                CancelledAt = now,
                ValidUntil = now,
                IsActive = false
            }, commandType: CommandType.StoredProcedure);

            await _notificationService.CreateAsync(
                userSub.UserId,
                "Подписка истекла",
                $"Срок действия вашей подписки '{userSub.SubscriptionName}' истек. Пожалуйста, продлите её, чтобы продолжить пользоваться сервисом.",
                NotificationType.Warning
            );

            return Ok(new { Message = $"Subscription {userSub.SubscriptionName} for user {userSub.UserId} has been expired and user notified." });
        }

        private DateTime CalculateNextBillingDate(string period)
        {
            return period.ToLower() switch
            {
                "monthly" => DateTime.UtcNow.AddMonths(1),
                "quarterly" => DateTime.UtcNow.AddMonths(3),
                "yearly" => DateTime.UtcNow.AddYears(1),
                _ => DateTime.UtcNow.AddMonths(1)
            };
        }
    }
}