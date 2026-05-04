using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using SubscriptionManager.Core.DTOs;
using SubscriptionManager.Core.Models;
using SubscriptionManager.Subscriptions.Infrastructure.Services;
using System.Data;
using System.Security.Claims;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace SubscriptionManager.Subscriptions.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PromoCodesController : ControllerBase
    {
        private const decimal MaxPercentDiscountValue = 99m;
        private const decimal MaxMonetaryValue = 100000m;
        private const int MaxDaysBack = 365;
        private const int MaxTopUsersCount = 10000;

        private sealed class PromoNotificationInfo
        {
            public Guid Id { get; set; }
            public string Code { get; set; } = string.Empty;
            public string Title { get; set; } = string.Empty;
            public string? Description { get; set; }
        }

        private sealed class PromoNotificationConditionRow
        {
            public Guid? SubscriptionId { get; set; }
            public string? SubscriptionName { get; set; }
            public Guid? PeriodId { get; set; }
            public string? PeriodName { get; set; }
            public decimal? MinAmount { get; set; }
        }

        private readonly string _connectionString;
        private readonly INotificationService _notificationService;

        public PromoCodesController(
            IConfiguration configuration,
            INotificationService notificationService)
        {
            _connectionString = configuration.GetConnectionString("SubscriptionsConnection")
                ?? throw new InvalidOperationException("Connection string 'SubscriptionsConnection' not found.");
            _notificationService = notificationService;
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(PromoCodeCreateResultDto), StatusCodes.Status201Created)]
        public async Task<ActionResult<PromoCodeCreateResultDto>> Create([FromBody] CreatePromoCodeRequest request)
        {
            request.Code = NormalizeText(request.Code, true);
            request.Title = NormalizeText(request.Title);
            request.Description = NormalizeText(request.Description);

            if (string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest("Promo code is required.");
            }

            if (string.IsNullOrWhiteSpace(request.Title))
            {
                return BadRequest("Promo title is required.");
            }

            if (request.ValidTo <= request.ValidFrom)
            {
                return BadRequest("Promo code validTo must be greater than validFrom.");
            }

            if (request.DiscountType == 1 && request.DiscountValue > MaxPercentDiscountValue)
            {
                return BadRequest($"Percentage discount cannot exceed {MaxPercentDiscountValue:0}.");
            }

            if (request.DiscountType == 2 && request.DiscountValue > MaxMonetaryValue)
            {
                return BadRequest($"Fixed discount cannot exceed {MaxMonetaryValue:0.##}.");
            }

            if (request.TotalUsageLimit.HasValue && request.TotalUsageLimit < request.PerUserUsageLimit)
            {
                return BadRequest("Total usage limit cannot be less than per-user usage limit.");
            }

            if (request.Conditions.Any(c => c.MinAmount.HasValue && c.MinAmount.Value < 0))
            {
                return BadRequest("Condition minAmount cannot be negative.");
            }

            if (request.Conditions.Any(c => c.MinAmount.HasValue && c.MinAmount.Value > MaxMonetaryValue))
            {
                return BadRequest($"Condition minAmount cannot exceed {MaxMonetaryValue:0.##}.");
            }

            if (request.MaxDiscountAmount.HasValue && request.MaxDiscountAmount.Value > MaxMonetaryValue)
            {
                return BadRequest($"MaxDiscountAmount cannot exceed {MaxMonetaryValue:0.##}.");
            }

            if (request.MinAmount.HasValue && request.MinAmount.Value > MaxMonetaryValue)
            {
                return BadRequest($"MinAmount cannot exceed {MaxMonetaryValue:0.##}.");
            }

            if (request.DaysBack > MaxDaysBack)
            {
                return BadRequest($"DaysBack cannot exceed {MaxDaysBack}.");
            }

            if (request.TopUsersCount > MaxTopUsersCount)
            {
                return BadRequest($"TopUsersCount cannot exceed {MaxTopUsersCount}.");
            }

            try
            {
                var adminIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                Guid.TryParse(adminIdClaim?.Value, out var adminId);

                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var created = await connection.QueryFirstAsync<PromoCodeDto>(
                    "sp_PromoCodes_Create",
                    new
                    {
                        Id = Guid.NewGuid(),
                        request.Code,
                        request.Title,
                        request.Description,
                        request.DiscountType,
                        request.DiscountValue,
                        request.MaxDiscountAmount,
                        request.ValidFrom,
                        request.ValidTo,
                        request.TotalUsageLimit,
                        request.PerUserUsageLimit,
                        SubscriptionId = (Guid?)null,
                        PeriodId = (Guid?)null,
                        MinAmount = (decimal?)null
                    },
                    commandType: CommandType.StoredProcedure);

                var conditions = request.Conditions
                    .Select(c => new
                    {
                        c.SubscriptionId,
                        c.PeriodId,
                        c.MinAmount
                    })
                    .Distinct()
                    .ToList();

                if (conditions.Count == 0)
                {
                    // Empty conditions list means promo code is applicable to all subscriptions and periods.
                    conditions.Add(new
                    {
                        SubscriptionId = request.SubscriptionId,
                        PeriodId = request.PeriodId,
                        MinAmount = request.MinAmount
                    });
                }

                var conditionsJson = JsonSerializer.Serialize(conditions);
                await connection.ExecuteAsync(
                    "sp_PromoCodes_SetConditions",
                    new
                    {
                        PromoCodeId = created.Id,
                        ConditionsJson = conditionsJson
                    },
                    commandType: CommandType.StoredProcedure);

                var promoForNotification = await GetPromoNotificationInfoAsync(connection, created.Id);
                var promoConditions = await GetPromoNotificationConditionsAsync(connection, created.Id);
                var notificationMessage = BuildPromoNotificationMessage(promoForNotification, promoConditions);

                var audienceUsers = (await connection.QueryAsync<PromoCodeAudienceUserDto>(
                    "sp_PromoCodes_GetAudienceUsers",
                    new
                    {
                        request.AudienceType,
                        request.DaysBack,
                        request.TopUsersCount
                    },
                    commandType: CommandType.StoredProcedure)).DistinctBy(x => x.UserId).ToList();

                foreach (var user in audienceUsers)
                {
                    await connection.ExecuteAsync(
                        "sp_PromoCodes_AssignToUser",
                        new
                        {
                            PromoCodeId = created.Id,
                            UserId = user.UserId,
                            AssignedByAdminId = adminId == Guid.Empty ? (Guid?)null : adminId
                        },
                        commandType: CommandType.StoredProcedure);
                }

                foreach (var user in audienceUsers)
                {
                    await _notificationService.CreateAsync(
                        user.UserId,
                        "Новый промокод",
                        notificationMessage,
                        NotificationType.Info);
                }

                var result = new PromoCodeCreateResultDto
                {
                    PromoCode = created,
                    AssignedUsersCount = audienceUsers.Count,
                    AssignedAccounts = audienceUsers
                };

                return CreatedAtAction(nameof(GetDeliveryReport), new { promoCodeId = created.Id }, result);
            }
            catch (SqlException ex) when (ex.Number >= 50000)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("assign")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> Assign([FromBody] AssignPromoCodeRequest request)
        {
            if (request.UserIds.Count == 0)
            {
                return BadRequest("At least one user ID is required");
            }

            try
            {
                var adminIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                Guid.TryParse(adminIdClaim?.Value, out var adminId);

                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();
                using var transaction = await connection.BeginTransactionAsync();

                try
                {
                    foreach (var userId in request.UserIds.Distinct())
                    {
                        await connection.ExecuteAsync(
                            "sp_PromoCodes_AssignToUser",
                            new
                            {
                                request.PromoCodeId,
                                UserId = userId,
                                AssignedByAdminId = adminId == Guid.Empty ? (Guid?)null : adminId
                            },
                            transaction,
                            commandType: CommandType.StoredProcedure);
                    }

                    var promo = await connection.QueryFirstOrDefaultAsync<PromoNotificationInfo>(
                        "sp_PromoCodes_GetNotificationHeader",
                        new { Id = request.PromoCodeId },
                        transaction,
                        commandType: CommandType.StoredProcedure);

                    var promoConditions = promo == null
                        ? Array.Empty<PromoNotificationConditionRow>()
                        : (await GetPromoNotificationConditionsAsync(connection, request.PromoCodeId, transaction)).ToArray();
                    var notificationMessage = promo == null
                        ? string.Empty
                        : BuildPromoNotificationMessage(promo, promoConditions);

                    await transaction.CommitAsync();

                    if (promo != null)
                    {
                        foreach (var userId in request.UserIds.Distinct())
                        {
                            await _notificationService.CreateAsync(
                                userId,
                                "Новый промокод",
                                notificationMessage,
                                NotificationType.Info);
                        }
                    }
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (SqlException ex) when (ex.Number >= 50000)
            {
                return BadRequest(ex.Message);
            }

            return NoContent();
        }

        [HttpGet("audience-preview")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(IEnumerable<PromoCodeAudienceUserDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<PromoCodeAudienceUserDto>>> GetAudiencePreview(
            [FromQuery] int audienceType = 1,
            [FromQuery] int daysBack = 30,
            [FromQuery] int topUsersCount = 100)
        {
            if (audienceType is < 1 or > 4)
            {
                return BadRequest("AudienceType should be between 1 and 4.");
            }

            if (daysBack is < 1 or > MaxDaysBack)
            {
                return BadRequest($"DaysBack should be between 1 and {MaxDaysBack}.");
            }

            if (topUsersCount < 1)
            {
                return BadRequest("TopUsersCount should be greater than 0.");
            }

            if (topUsersCount > MaxTopUsersCount)
            {
                return BadRequest($"TopUsersCount should not exceed {MaxTopUsersCount}.");
            }

            try
            {
                using var connection = new SqlConnection(_connectionString);
                var users = await connection.QueryAsync<PromoCodeAudienceUserDto>(
                    "sp_PromoCodes_GetAudienceUsers",
                    new
                    {
                        AudienceType = audienceType,
                        DaysBack = daysBack,
                        TopUsersCount = topUsersCount
                    },
                    commandType: CommandType.StoredProcedure);

                return Ok(users);
            }
            catch (SqlException ex) when (ex.Number >= 50000)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("admin")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(IEnumerable<PromoCodeDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<PromoCodeDto>>> GetAdminList()
        {
            using var connection = new SqlConnection(_connectionString);
            var promos = await connection.QueryAsync<PromoCodeDto>(
                "sp_PromoCodes_GetAdminList",
                commandType: CommandType.StoredProcedure);

            return Ok(promos);
        }

        [HttpGet("my")]
        [ProducesResponseType(typeof(IEnumerable<PromoCodeDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<PromoCodeDto>>> GetMine()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized();
            }

            using var connection = new SqlConnection(_connectionString);
            IEnumerable<PromoCodeDto> result;
            try
            {
                result = await connection.QueryAsync<PromoCodeDto>(
                    "sp_PromoCodes_GetAssignedHistoryByUserId",
                    new { UserId = userId },
                    commandType: CommandType.StoredProcedure);
            }
            catch (SqlException)
            {
                // Backward compatibility while DB proc is being rolled out.
                result = await connection.QueryAsync<PromoCodeDto>(
                    "sp_PromoCodes_GetAssignedByUserId",
                    new { UserId = userId },
                    commandType: CommandType.StoredProcedure);
            }

            return Ok(result);
        }

        [HttpPost("validate")]
        [ProducesResponseType(typeof(PromoCodeValidationResultDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<PromoCodeValidationResultDto>> Validate([FromBody] ValidatePromoCodeRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized();
            }

            try
            {
                using var connection = new SqlConnection(_connectionString);
                var result = await connection.QueryFirstAsync<PromoCodeValidationResultDto>(
                    "sp_PromoCodes_ValidateForPayment",
                    new
                    {
                        UserId = userId,
                        request.SubscriptionPriceId,
                        request.PromoCode
                    },
                    commandType: CommandType.StoredProcedure);

                return Ok(result);
            }
            catch (SqlException ex) when (ex.Number >= 50000)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("{promoCodeId:guid}/delivery-report")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(PromoCodeDeliverySummaryDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<PromoCodeDeliverySummaryDto>> GetDeliveryReport([FromRoute] Guid promoCodeId)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                using var multi = await connection.QueryMultipleAsync(
                    "sp_PromoCodes_GetDeliveryReport",
                    new { PromoCodeId = promoCodeId },
                    commandType: CommandType.StoredProcedure);

                var summary = await multi.ReadFirstAsync<PromoCodeDeliverySummaryDto>();
                summary.Accounts = (await multi.ReadAsync<PromoCodeDeliveryReportItemDto>()).ToList();

                return Ok(summary);
            }
            catch (SqlException ex) when (ex.Number >= 50000)
            {
                return BadRequest(ex.Message);
            }
        }

        private async Task<PromoNotificationInfo> GetPromoNotificationInfoAsync(SqlConnection connection, Guid promoCodeId)
        {
            return await connection.QueryFirstAsync<PromoNotificationInfo>(
                "sp_PromoCodes_GetNotificationHeader",
                new { Id = promoCodeId },
                commandType: CommandType.StoredProcedure);
        }

        private async Task<IEnumerable<PromoNotificationConditionRow>> GetPromoNotificationConditionsAsync(
            SqlConnection connection,
            Guid promoCodeId,
            IDbTransaction? transaction = null)
        {
            return await connection.QueryAsync<PromoNotificationConditionRow>(
                "sp_PromoCodes_GetNotificationConditions",
                new { PromoCodeId = promoCodeId },
                transaction,
                commandType: CommandType.StoredProcedure);
        }

        private static string BuildPromoNotificationMessage(
            PromoNotificationInfo promo,
            IEnumerable<PromoNotificationConditionRow> conditions)
        {
            var parts = new List<string>
            {
                $"Промокод: {promo.Code} ({promo.Title})"
            };

            if (!string.IsNullOrWhiteSpace(promo.Description))
            {
                parts.Add($"Описание: {promo.Description.Trim()}");
            }

            var conditionTexts = conditions
                .Select(BuildSingleConditionText)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .ToList();

            if (conditionTexts.Count == 0)
            {
                parts.Add("Применение: любая подписка, любой период");
            }
            else
            {
                parts.Add($"Применение: {string.Join(" • ", conditionTexts)}");
            }

            return string.Join(" | ", parts);
        }

        private static string BuildSingleConditionText(PromoNotificationConditionRow condition)
        {
            var parts = new List<string>();

            if (!string.IsNullOrWhiteSpace(condition.SubscriptionName))
            {
                parts.Add($"подписка \"{condition.SubscriptionName}\"");
            }
            else if (condition.SubscriptionId == null)
            {
                parts.Add("любая подписка");
            }

            if (!string.IsNullOrWhiteSpace(condition.PeriodName))
            {
                parts.Add($"период \"{condition.PeriodName}\"");
            }
            else if (condition.PeriodId == null)
            {
                parts.Add("любой период");
            }

            if (condition.MinAmount.HasValue)
            {
                parts.Add($"минимальная сумма {condition.MinAmount.Value:0.##}");
            }

            return string.Join(", ", parts);
        }

        private static string NormalizeText(string? value, bool uppercase = false)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            var normalized = Regex.Replace(value.Trim(), @"\s+", " ");
            return uppercase ? normalized.ToUpperInvariant() : normalized;
        }
    }
}
