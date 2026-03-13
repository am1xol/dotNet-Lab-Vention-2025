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
		private readonly ILogger<UserSubscriptionsController> _logger;

		public UserSubscriptionsController(
            IConfiguration configuration,
            IFileStorageService fileStorageService,
            IPaymentGatewayService paymentGateway,
            INotificationService notificationService,
			ILogger<UserSubscriptionsController> logger)
        {
            _connectionString = configuration.GetConnectionString("SubscriptionsConnection")
                ?? throw new InvalidOperationException("Connection string 'SubscriptionsConnection' not found.");
            _fileStorageService = fileStorageService;
            _paymentGateway = paymentGateway;
            _notificationService = notificationService;
			_logger = logger;
		}

		[HttpPost("initiate-payment/{subscriptionPriceId}")]
		[ProducesResponseType(typeof(PaymentInitiationResult), StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status401Unauthorized)]
		public async Task<ActionResult<PaymentInitiationResult>> InitiateSubscriptionPayment([FromRoute] Guid subscriptionPriceId)
		{
			var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
			if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
				return Unauthorized();

			using var connection = new SqlConnection(_connectionString);
			await connection.OpenAsync();
			using var transaction = await connection.BeginTransactionAsync();

			try
			{
				const string getPriceSql = @"
            SELECT sp.*, s.*, p.*
            FROM SubscriptionPrices sp
            INNER JOIN Subscriptions s ON sp.SubscriptionId = s.Id
            INNER JOIN Periods p ON sp.PeriodId = p.Id
            WHERE sp.Id = @Id";

				var priceData = await connection.QueryAsync<SubscriptionPrice, Subscription, Period, dynamic>(
					getPriceSql,
					(sp, s, p) => new { SubscriptionPrice = sp, Subscription = s, Period = p },
					new { Id = subscriptionPriceId },
					transaction,
					splitOn: "Id,Id"
				);

				var item = priceData.FirstOrDefault();
				if (item == null)
				{
					await transaction.RollbackAsync();
					return NotFound("Subscription price not found");
				}

				var subscriptionPrice = item.SubscriptionPrice;
				var subscription = item.Subscription;
				var period = item.Period;

				if (!subscription.IsActive)
				{
					await transaction.RollbackAsync();
					return BadRequest("Subscription is not active");
				}

				const string checkExistingSql = @"
            SELECT COUNT(1) 
            FROM UserSubscriptions us
            INNER JOIN SubscriptionPrices sp ON us.SubscriptionPriceId = sp.Id
            WHERE us.UserId = @UserId AND sp.SubscriptionId = @SubscriptionId AND us.IsActive = 1";

				var existingCount = await connection.ExecuteScalarAsync<int>(
					checkExistingSql,
					new { UserId = userId, SubscriptionId = subscription.Id },
					transaction);

				if (existingCount > 0)
				{
					await transaction.RollbackAsync();
					return BadRequest("User already subscribed to this service");
				}

				var userSubscription = new UserSubscription
				{
					Id = Guid.NewGuid(),
					UserId = userId,
					SubscriptionPriceId = subscriptionPrice.Id,
					StartDate = DateTime.UtcNow,
					NextBillingDate = CalculateNextBillingDate(period.MonthsCount),
					IsActive = false
				};

				const string insertUserSubSql = "sp_UserSubscriptions_Insert";
				await connection.ExecuteAsync(
					insertUserSubSql,
					new
					{
						userSubscription.Id,
						userSubscription.UserId,
						userSubscription.SubscriptionPriceId,
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
					Amount = subscriptionPrice.FinalPrice,
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
					subscriptionPrice.FinalPrice,
					"BYN",
					$"Subscription: {subscription.Name} ({period.Name})",
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
            var recentResults = await connection.QueryAsync<dynamic>(recentProc, new { UserId = userId }, commandType: CommandType.StoredProcedure);

            var recentPayments = recentResults.Select(r => new PaymentDto
            {
                Id = r.Id,
                UserSubscriptionId = r.UserSubscriptionId,
                Amount = r.Amount,
                Currency = r.Currency,
                PaymentDate = r.PaymentDate,
                PeriodStart = r.PeriodStart,
                PeriodEnd = r.PeriodEnd,
                Status = ((PaymentStatus)r.Status).ToString(),
                CardLastFour = r.CardLastFour ?? "",
                CardBrand = r.CardBrand ?? "",
                Subscription = new SubscriptionDto
                {
                    Id = r.SubscriptionId,
                    Name = r.SubscriptionName,
                    Price = r.Price
                }
            }).ToList();

            const string upcomingProc = "sp_GetUpcomingPayments";
            var upcomingPayments = await connection.QueryAsync<UpcomingPaymentDto>(
                upcomingProc,
                new { UserId = userId },
                commandType: CommandType.StoredProcedure);

            stats.RecentPayments = recentPayments;
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

			var results = await connection.QueryAsync<dynamic>(historyProc, parameters, commandType: CommandType.StoredProcedure);
			var totalCount = parameters.Get<int>("@TotalCount");

			var payments = results.Select(r => new PaymentDto
			{
				Id = r.Id,
				UserSubscriptionId = r.UserSubscriptionId,
				Amount = r.Amount,
				Currency = r.Currency,
				PaymentDate = r.PaymentDate,
				PeriodStart = r.PeriodStart,
				PeriodEnd = r.PeriodEnd,
				Status = ((PaymentStatus)r.Status).ToString(),
				CardLastFour = r.CardLastFour ?? "",
				CardBrand = r.CardBrand ?? "",
				Subscription = new SubscriptionDto
				{
					Id = r.SubscriptionId,
					Name = r.Name,
					Price = r.Price,
					PeriodName = r.Period 
				}
			}).ToList();

			return Ok(new
			{
				items = payments,
				totalCount,
				pageNumber,
				pageSize
			});
		}

		[HttpPost("subscribe/{subscriptionPriceId}")]
		[ProducesResponseType(typeof(SubscribeResponse), StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<ActionResult<SubscribeResponse>> Subscribe(Guid subscriptionPriceId)
		{
			var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
			if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
				return Unauthorized("Invalid user ID in token");

			using var connection = new SqlConnection(_connectionString);
			await connection.OpenAsync();
			using var transaction = await connection.BeginTransactionAsync();

			try
			{
				const string getPriceSql = @"
            SELECT sp.*, s.*, p.*
            FROM SubscriptionPrices sp
            INNER JOIN Subscriptions s ON sp.SubscriptionId = s.Id
            INNER JOIN Periods p ON sp.PeriodId = p.Id
            WHERE sp.Id = @Id";

				var priceData = await connection.QueryAsync<SubscriptionPrice, Subscription, Period, dynamic>(
					getPriceSql,
					(sp, s, p) => new { SubscriptionPrice = sp, Subscription = s, Period = p },
					new { Id = subscriptionPriceId },
					transaction,
					splitOn: "Id,Id"
				);

				var item = priceData.FirstOrDefault();
				if (item == null)
				{
					await transaction.RollbackAsync();
					return NotFound("Subscription price not found");
				}

				var subscriptionPrice = item.SubscriptionPrice;
				var subscription = item.Subscription;
				var period = item.Period;

				if (!subscription.IsActive)
				{
					await transaction.RollbackAsync();
					return BadRequest("Subscription is not active");
				}

				const string checkExistingSql = @"
            SELECT COUNT(1) 
            FROM UserSubscriptions us
            INNER JOIN SubscriptionPrices sp ON us.SubscriptionPriceId = sp.Id
            WHERE us.UserId = @UserId AND sp.SubscriptionId = @SubscriptionId AND us.IsActive = 1";

				var existing = await connection.ExecuteScalarAsync<int>(
					checkExistingSql,
					new { UserId = userId, SubscriptionId = subscription.Id },
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
					SubscriptionPriceId = subscriptionPrice.Id,
					StartDate = DateTime.UtcNow,
					NextBillingDate = CalculateNextBillingDate(period.MonthsCount),
					IsActive = true
				};

				const string insertSql = "sp_UserSubscriptions_Insert";
				await connection.ExecuteAsync(
					insertSql,
					new
					{
						userSubscription.Id,
						userSubscription.UserId,
						userSubscription.SubscriptionPriceId,
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
					SubscriptionId = subscription.Id,
					StartDate = userSubscription.StartDate,
					NextBillingDate = userSubscription.NextBillingDate,
					IsActive = userSubscription.IsActive
				});
			}
			catch (Exception ex)
			{
				await transaction.RollbackAsync();
                _logger.LogError(ex, "Error subscribing user {UserId} to subscription price {SubscriptionPriceId}", userId, subscriptionPriceId);
				return StatusCode(500, "Internal server error");
			}
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

            var results = await connection.QueryAsync<dynamic>(sql, parameters, commandType: CommandType.StoredProcedure);
            var totalCount = parameters.Get<int>("@TotalCount");

            var dtos = results.Select(r => new UserSubscriptionDto
            {
                Id = r.Id,
                UserId = r.UserId,
                SubscriptionPriceId = r.SubscriptionPriceId,
                StartDate = r.StartDate,
                NextBillingDate = r.NextBillingDate,
                CancelledAt = r.CancelledAt,
                ValidUntil = r.ValidUntil,
                IsActive = r.IsActive,
                PeriodName = r.PeriodName,
                FinalPrice = r.FinalPrice,
                Subscription = new SubscriptionDto
                {
                    Id = r.SubscriptionId != null ? (Guid)r.SubscriptionId : Guid.Empty,
                    Name = r.SubscriptionName,
                    Category = r.Category,
                    Price = r.Price != null ? (decimal)r.Price : 0m,
                    IconFileId = r.IconFileId != null ? (Guid?)r.IconFileId : null,
                    IconUrl = r.IconUrl,
                    IsActive = r.SubscriptionIsActive != null ? (bool)r.SubscriptionIsActive : false,
                    CreatedAt = r.SubscriptionCreatedAt != null ? (DateTime)r.SubscriptionCreatedAt : DateTime.MinValue,
                    UpdatedAt = r.SubscriptionUpdatedAt != null ? (DateTime)r.SubscriptionUpdatedAt : DateTime.MinValue,
                    Description = r.Description,
                    DescriptionMarkdown = r.DescriptionMarkdown
                }
            }).ToList();

            foreach (var dto in dtos)
            {
                if (dto.Subscription.IconFileId.HasValue)
                {
                    try
                    {
                        dto.Subscription.IconUrl = await _fileStorageService.GetPresignedUrlAsync(dto.Subscription.IconFileId.Value);
                    }
                    catch
                    {
                        dto.Subscription.IconUrl = null;
                    }
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

        [HttpGet("subscription-history")]
        [ProducesResponseType(typeof(PagedResult<UserSubscriptionDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<PagedResult<UserSubscriptionDto>>> GetSubscriptionHistory(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 5)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized();

            using var connection = new SqlConnection(_connectionString);
            const string sql = "sp_UserSubscriptions_GetHistoryByUserIdPaged";
            var parameters = new DynamicParameters();
            parameters.Add("@UserId", userId);
            parameters.Add("@PageNumber", pageNumber);
            parameters.Add("@PageSize", pageSize);
            parameters.Add("@TotalCount", dbType: DbType.Int32, direction: ParameterDirection.Output);

            var results = await connection.QueryAsync<dynamic>(sql, parameters, commandType: CommandType.StoredProcedure);
            var totalCount = parameters.Get<int>("@TotalCount");

            var dtos = results.Select(r => new UserSubscriptionDto
            {
                Id = r.Id,
                UserId = r.UserId,
                SubscriptionPriceId = r.SubscriptionPriceId,
                SubscriptionId = r.SubscriptionId,
                StartDate = r.StartDate,
                NextBillingDate = r.NextBillingDate,
                CancelledAt = r.CancelledAt,
                ValidUntil = r.ValidUntil,
                IsActive = r.IsActive,
                IsValid = r.IsValid != null ? (int)r.IsValid == 1 : false,
                Status = r.Status,
                PeriodName = r.PeriodName,
                FinalPrice = r.FinalPrice,
                Subscription = new SubscriptionDto
                {
                    Id = r.SubscriptionId,
                    Name = r.SubscriptionName,
                    Category = r.Category,
                    Price = r.Price,
                    IconFileId = r.IconFileId,
                    IconUrl = r.IconUrl,
                    IsActive = r.SubscriptionIsActive,
                    CreatedAt = r.SubscriptionCreatedAt,
                    UpdatedAt = r.SubscriptionUpdatedAt,
                    Description = r.Description,
                    DescriptionMarkdown = r.DescriptionMarkdown
                }
            }).ToList();

            return Ok(new PagedResult<UserSubscriptionDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
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
        SELECT us.Id, us.NextBillingDate 
        FROM UserSubscriptions us
        INNER JOIN SubscriptionPrices sp ON us.SubscriptionPriceId = sp.Id
        WHERE us.UserId = @UserId AND sp.SubscriptionId = @SubscriptionId AND us.IsActive = 1";

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
                INNER JOIN SubscriptionPrices sp ON us.SubscriptionPriceId = sp.Id
                INNER JOIN Subscriptions s ON sp.SubscriptionId = s.Id
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

		private DateTime CalculateNextBillingDate(int monthsCount)
		{
			return DateTime.UtcNow.AddMonths(monthsCount);
		}
	}
}