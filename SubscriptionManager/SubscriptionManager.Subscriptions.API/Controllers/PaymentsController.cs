using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubscriptionManager.Core;
using SubscriptionManager.Core.DTOs;
using SubscriptionManager.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace SubscriptionManager.Subscriptions.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly SubscriptionsDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<PaymentsController> _logger;

        public PaymentsController(SubscriptionsDbContext context, IConfiguration configuration, ILogger<PaymentsController> logger)
        {
            _context = context;
            _configuration = configuration;
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
                _logger.LogError("Invalid TrackingId format");
                return BadRequest("Invalid TrackingId");
            }

            var payment = await _context.Payments
                .Include(p => p.UserSubscription)
                .FirstOrDefaultAsync(p => p.Id == paymentId);

            if (payment == null)
            {
                _logger.LogError("Payment not found: {PaymentId}", paymentId);
                return NotFound("Payment not found");
            }

            if (webhookData.Transaction.Status == "successful")
            {
                payment.Status = PaymentStatus.Completed;
                payment.ExternalTransactionId = webhookData.Transaction.Id;
                payment.CardLastFour = webhookData.Transaction.CreditCard?.Last4 ?? "";
                payment.CardBrand = webhookData.Transaction.CreditCard?.Brand ?? "";

                if (payment.UserSubscription != null)
                {
                    payment.UserSubscription.IsActive = true; 
                    _logger.LogInformation("Subscription {SubId} activated for user {UserId}", payment.UserSubscription.Id, payment.UserId);
                }
            }
            else if (webhookData.Transaction.Status == "failed")
            {
                payment.Status = PaymentStatus.Failed;
                payment.ExternalTransactionId = webhookData.Transaction.Id;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Webhook processed" });
        }
    }
}
