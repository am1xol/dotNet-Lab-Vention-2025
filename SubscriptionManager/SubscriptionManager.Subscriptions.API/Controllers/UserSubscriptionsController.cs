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
            
            try
            {
                var dbData = await connection.QueryFirstOrDefaultAsync<dynamic>(
                    "sp_Payments_Initiate",
                    new { UserId = userId, SubscriptionPriceId = subscriptionPriceId },
                    commandType: CommandType.StoredProcedure
                );

                if (dbData == null)
                    return StatusCode(500, "Failed to initiate payment record");

                var userEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "customer@example.com";
                var expirationDate = DateTime.UtcNow.AddMinutes(30);

                var paymentResult = await _paymentGateway.InitiatePaymentAsync(
                    (decimal)dbData.Amount,
                    "BYN",
                    $"Subscription: {dbData.SubscriptionName} ({dbData.PeriodName})",
                    dbData.PaymentId.ToString(),
                    userEmail,
                    expirationDate
                );

                return Ok(paymentResult);
            }
            catch (SqlException ex) when (ex.Number == 50404)
            {
                return NotFound(ex.Message);
            }
            catch (SqlException ex) when (ex.Number >= 50000)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initiating payment for PriceId: {PriceId}", subscriptionPriceId);
                return StatusCode(500, "Internal server error");
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
                return Unauthorized();

            using var connection = new SqlConnection(_connectionString);
            
            var parameters = new DynamicParameters();
            parameters.Add("@UserId", userId);
            parameters.Add("@SubscriptionPriceId", subscriptionPriceId);
            parameters.Add("@ReturnValue", dbType: DbType.Int32, direction: ParameterDirection.ReturnValue);

            var result = await connection.QueryFirstOrDefaultAsync<dynamic>(
                "sp_UserSubscriptions_Subscribe",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            var statusCode = parameters.Get<int>("@ReturnValue");

            return statusCode switch
            {
                200 => Ok(new SubscribeResponse
                {
                    Id = result?.Id,
                    UserId = result?.UserId,
                    SubscriptionId = result?.SubscriptionId,
                    StartDate = result?.StartDate,
                    NextBillingDate = result?.NextBillingDate,
                    IsActive = result?.IsActive
                }),
                404 => NotFound("Subscription price not found"),
                400 => BadRequest("Subscription is not active"),
                409 => BadRequest("User already subscribed to this service"),
                _ => StatusCode(500, "Internal server error")
            };
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
                return Unauthorized();

            using var connection = new SqlConnection(_connectionString);
            
            var parameters = new DynamicParameters();
            parameters.Add("@UserId", userId);
            parameters.Add("@SubscriptionId", subscriptionId);
            parameters.Add("@Now", DateTime.UtcNow);
            parameters.Add("@ReturnValue", dbType: DbType.Int32, direction: ParameterDirection.ReturnValue);

            var validUntil = await connection.QueryFirstOrDefaultAsync<DateTime?>(
                "sp_UserSubscriptions_Unsubscribe",
                parameters,
                commandType: CommandType.StoredProcedure);

            var result = parameters.Get<int>("@ReturnValue");

            if (result == 404) return NotFound("Active subscription not found");

            return Ok(new { 
                Message = "Subscription cancelled successfully", 
                ValidUntil = validUntil 
            });
        }

        [HttpPost("admin/expire/{userSubscriptionId}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> AdminExpireSubscription(Guid userSubscriptionId)
        {
            using var connection = new SqlConnection(_connectionString);

            var parameters = new DynamicParameters();
            parameters.Add("@UserSubscriptionId", userSubscriptionId);
            parameters.Add("@Now", DateTime.UtcNow);
            parameters.Add("@ReturnValue", dbType: DbType.Int32, direction: ParameterDirection.ReturnValue);

            var subInfo = await connection.QueryFirstOrDefaultAsync<dynamic>(
                "sp_UserSubscriptions_AdminExpire",
                parameters,
                commandType: CommandType.StoredProcedure);

            if (parameters.Get<int>("@ReturnValue") == 404)
                return NotFound("User subscription not found");

            await _notificationService.CreateAsync(
                (Guid)subInfo?.UserId,
                "Подписка истекла",
                $"Срок действия вашей подписки '{subInfo?.SubscriptionName}' истек. Пожалуйста, продлите её.",
                NotificationType.Warning
            );

            return Ok(new { Message = $"Subscription {subInfo?.SubscriptionName} expired and user notified." });
        }

		private DateTime CalculateNextBillingDate(int monthsCount)
		{
			return DateTime.UtcNow.AddMonths(monthsCount);
		}
	}
}