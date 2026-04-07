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

namespace SubscriptionManager.Subscriptions.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PromoCodesController : ControllerBase
    {
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
                        "SELECT TOP 1 Id, Code, Title, Description FROM PromoCodes WHERE Id = @Id",
                        new { Id = request.PromoCodeId },
                        transaction);

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
                @"SELECT pc.Id, pc.Code, pc.Title, pc.Description, pc.DiscountType, pc.DiscountValue, pc.MaxDiscountAmount,
                         pc.ValidFrom, pc.ValidTo, pc.TotalUsageLimit, pc.PerUserUsageLimit,
                         c.SubscriptionId, c.PeriodId, c.MinAmount, 0 AS UserUsageCount
                  FROM PromoCodes pc
                  LEFT JOIN PromoCodeConditions c ON c.PromoCodeId = pc.Id
                  ORDER BY pc.CreatedAt DESC");

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
            var result = await connection.QueryAsync<PromoCodeDto>(
                "sp_PromoCodes_GetAssignedByUserId",
                new { UserId = userId },
                commandType: CommandType.StoredProcedure);

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
                @"SELECT TOP 1 Id, Code, Title, Description
                  FROM PromoCodes
                  WHERE Id = @Id",
                new { Id = promoCodeId });
        }

        private async Task<IEnumerable<PromoNotificationConditionRow>> GetPromoNotificationConditionsAsync(
            SqlConnection connection,
            Guid promoCodeId,
            IDbTransaction? transaction = null)
        {
            return await connection.QueryAsync<PromoNotificationConditionRow>(
                @"SELECT
                    c.SubscriptionId,
                    s.Name AS SubscriptionName,
                    c.PeriodId,
                    p.Name AS PeriodName,
                    c.MinAmount
                  FROM PromoCodeConditions c
                  LEFT JOIN Subscriptions s ON s.Id = c.SubscriptionId
                  LEFT JOIN Periods p ON p.Id = c.PeriodId
                  WHERE c.PromoCodeId = @PromoCodeId",
                new { PromoCodeId = promoCodeId },
                transaction);
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
    }
}
