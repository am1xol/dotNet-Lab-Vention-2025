using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubscriptionManager.Core;
using SubscriptionManager.Core.DTOs;
using SubscriptionManager.Core.Models;
using SubscriptionManager.Subscriptions.Infrastructure.Data;
using SubscriptionManager.Subscriptions.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace SubscriptionManager.Subscriptions.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly SubscriptionsDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly INotificationService _notificationService;
        private readonly ILogger<PaymentsController> _logger;

        public PaymentsController(SubscriptionsDbContext context, IConfiguration configuration, INotificationService notificationService, ILogger<PaymentsController> logger)
        {
            _context = context;
            _configuration = configuration;
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
            {
                return BadRequest("Invalid TrackingId");
            }

            var payment = await _context.Payments
                .Include(p => p.UserSubscription)
                .FirstOrDefaultAsync(p => p.Id == paymentId);

            if (payment == null)
            {
                return NotFound("Payment not found");
            }

            payment.ExternalTransactionId = webhookData.Transaction.Id;

            switch (webhookData.Transaction.Status)
            {
                case "successful":
                    payment.Status = PaymentStatus.Completed;
                    payment.CardLastFour = webhookData.Transaction.CreditCard?.Last4 ?? "";
                    payment.CardBrand = webhookData.Transaction.CreditCard?.Brand ?? "";

                    if (payment.UserSubscription != null)
                    {
                        payment.UserSubscription.IsActive = true;
                        _logger.LogInformation("Subscription activated: {SubId}", payment.UserSubscription.Id);
                        await _notificationService.CreateAsync(payment.UserId, 
                            "Подписка активна", 
                            "Оплата прошла успешно!", 
                            NotificationType.Info);
                    }
                    break;

                case "failed":
                case "error":  
                case "expired":
                    payment.Status = PaymentStatus.Failed;
                    await _notificationService.CreateAsync(payment.UserId, 
                        "Ошибка оплаты", 
                        "Не удалось провести платеж. Проверьте данные карты.", 
                        NotificationType.Error);
                    _logger.LogWarning("Payment failed with status: {Status}", webhookData.Transaction.Status);
                    break;

                default:
                    _logger.LogInformation("Unhandled status: {Status}", webhookData.Transaction.Status);
                    break;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Webhook processed" });
        }
    }
}
