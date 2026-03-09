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

                const string updatePaymentSql = "sp_Payments_UpdateStatus";
                var parameters = new DynamicParameters();
                parameters.Add("@Id", paymentId);
                parameters.Add("@ExternalTransactionId", webhookData.Transaction.Id);

                switch (webhookData.Transaction.Status)
                {
                    case "successful":
                        parameters.Add("@Status", PaymentStatus.Completed);
                        parameters.Add("@CardLastFour", webhookData.Transaction.CreditCard?.Last4 ?? "");
                        parameters.Add("@CardBrand", webhookData.Transaction.CreditCard?.Brand ?? "");
                        break;

                    case "failed":
                    case "error":
                    case "expired":
                        parameters.Add("@Status", PaymentStatus.Failed);
                        parameters.Add("@CardLastFour", (string?)null);
                        parameters.Add("@CardBrand", (string?)null);
                        break;

                    default:
                        _logger.LogInformation("Unhandled status: {Status}. Ignoring webhook.", webhookData.Transaction.Status);
                        await transaction.CommitAsync();
                        return Ok(new { message = "Webhook ignored (unhandled status)" });
                }

                await connection.ExecuteAsync(
                    updatePaymentSql,
                    parameters,
                    transaction,
                    commandType: CommandType.StoredProcedure);

                if (webhookData.Transaction.Status == "successful")
                {
                    const string activateSubSql = @"
                        UPDATE UserSubscriptions 
                        SET IsActive = 1 
                        WHERE Id = @UserSubscriptionId";
                    await connection.ExecuteAsync(
                        activateSubSql,
                        new { payment.UserSubscriptionId },
                        transaction);

                    await _notificationService.CreateAsync(
                        payment.UserId,
                        "Подписка активна",
                        "Оплата прошла успешно!",
                        NotificationType.Info);

                    _logger.LogInformation("Subscription {SubId} activated for user {UserId}",
                        payment.UserSubscriptionId, payment.UserId);
                }
                else if (webhookData.Transaction.Status == "failed" ||
                         webhookData.Transaction.Status == "error" ||
                         webhookData.Transaction.Status == "expired")
                {
                    await _notificationService.CreateAsync(
                        payment.UserId,
                        "Ошибка оплаты",
                        "Не удалось провести платеж. Проверьте данные карты.",
                        NotificationType.Error);

                    _logger.LogWarning("Payment failed for user {UserId}, status: {Status}",
                        payment.UserId, webhookData.Transaction.Status);
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