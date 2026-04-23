using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using SubscriptionManager.Core;
using SubscriptionManager.Core.DTOs;
using SubscriptionManager.Core.Models;
using SubscriptionManager.Subscriptions.Infrastructure.Services;
using System.Data;

namespace SubscriptionManager.Subscriptions.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly string _connectionString;
        private readonly INotificationService _notificationService;
        private readonly ILogger<PaymentsController> _logger;

        public PaymentsController(
            IConfiguration configuration,
            INotificationService notificationService,
            ILogger<PaymentsController> logger)
        {
            _connectionString = configuration.GetConnectionString("SubscriptionsConnection")
                ?? throw new InvalidOperationException("Connection string 'SubscriptionsConnection' not found.");
            _notificationService = notificationService;
            _logger = logger;
        }

        [HttpPost("webhook")]
        [AllowAnonymous]
        public async Task<IActionResult> BePaidWebhook([FromBody] BePaidWebhookModel webhookData)
        {
            _logger.LogInformation("Received webhook from bePaid: {Status} for TrackingId: {TrackingId}",
                webhookData.Transaction.Status, webhookData.Transaction.TrackingId);

            if (!Guid.TryParse(webhookData.Transaction.TrackingId, out var paymentId))
                return BadRequest("Invalid TrackingId");

            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            using var transaction = await connection.BeginTransactionAsync();

            try
            {
                const string getPaymentSql = "SELECT * FROM Payments WHERE Id = @Id";
                var payment = await connection.QueryFirstOrDefaultAsync<Payment>(
                    getPaymentSql,
                    new { Id = paymentId },
                    transaction);

                if (payment == null)
                {
                    _logger.LogWarning("Payment not found for Id: {PaymentId}", paymentId);
                    return NotFound("Payment not found");
                }

                PaymentStatus? targetStatus = webhookData.Transaction.Status switch
                {
                    "successful" => PaymentStatus.Completed,
                    "failed" or "error" or "expired" => PaymentStatus.Failed,
                    _ => null
                };

                if (!targetStatus.HasValue)
                {
                    _logger.LogInformation("Unhandled status: {Status}. Ignoring webhook.", webhookData.Transaction.Status);
                    await transaction.CommitAsync();
                    return Ok(new { message = "Webhook ignored" });
                }

                if (payment.Status == targetStatus.Value)
                {
                    _logger.LogInformation(
                        "Duplicate webhook ignored for payment {PaymentId}: status {Status} is already applied.",
                        paymentId,
                        webhookData.Transaction.Status);
                    await transaction.CommitAsync();
                    return Ok(new { message = "Duplicate webhook ignored" });
                }

                var paymentParams = new DynamicParameters();
                paymentParams.Add("@Id", paymentId);
                paymentParams.Add("@ExternalTransactionId", webhookData.Transaction.Id);
                paymentParams.Add("@Status", targetStatus.Value);

                switch (webhookData.Transaction.Status)
                {
                    case "successful":
                        paymentParams.Add("@CardLastFour", webhookData.Transaction.CreditCard?.Last4 ?? "");
                        paymentParams.Add("@CardBrand", webhookData.Transaction.CreditCard?.Brand ?? "");
                        break;

                    case "failed":
                    case "error":
                    case "expired":
                        paymentParams.Add("@CardLastFour", (string?)null);
                        paymentParams.Add("@CardBrand", (string?)null);
                        break;
                }

                await connection.ExecuteAsync(
                    "sp_Payments_UpdateStatus",
                    paymentParams,
                    transaction,
                    commandType: CommandType.StoredProcedure);

                if (webhookData.Transaction.Status == "successful")
                {
                    await connection.ExecuteAsync(
                        "sp_UserSubscriptions_Update",
                        new { Id = payment.UserSubscriptionId, IsActive = 1 },
                        transaction,
                        commandType: CommandType.StoredProcedure);

                    await connection.ExecuteAsync(
                        "sp_PromoCodes_RegisterUsageForPayment",
                        new { PaymentId = paymentId },
                        transaction,
                        commandType: CommandType.StoredProcedure);

                    await _notificationService.CreateAsync(
                        payment.UserId,
                        "Подписка активна",
                        "Оплата прошла успешно!",
                        NotificationType.Success);
                }
                else if (new[] { "failed", "error", "expired" }.Contains(webhookData.Transaction.Status))
                {
                    await _notificationService.CreateAsync(
                        payment.UserId,
                        "Ошибка оплаты",
                        "Не удалось провести платеж. Проверьте данные карты.",
                        NotificationType.Error);
                }

                await transaction.CommitAsync();
                return Ok(new { message = "Webhook processed successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing webhook for payment {PaymentId}", paymentId);
                await transaction.RollbackAsync();
                return StatusCode(500, "Internal server error");
            }
        }
    }
}