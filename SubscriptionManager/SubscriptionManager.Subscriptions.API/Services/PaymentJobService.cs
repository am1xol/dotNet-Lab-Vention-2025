using SubscriptionManager.Core;
using SubscriptionManager.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using SubscriptionManager.Core.Interfaces;

namespace SubscriptionManager.Subscriptions.API.Services
{
    public interface IPaymentJobService
    {
        Task<int> CleanupStuckPaymentsAsync(CancellationToken ct);
    }
    public class PaymentJobService : IPaymentJobService
    {
        private readonly SubscriptionsDbContext _context;
        private readonly IPaymentGatewayService _gatewayService;
        private readonly ILogger<PaymentJobService> _logger;

        public PaymentJobService(SubscriptionsDbContext context, IPaymentGatewayService gatewayService, ILogger<PaymentJobService> logger)
        {
            _context = context;
            _gatewayService = gatewayService;
            _logger = logger;
        }

        public async Task<int> CleanupStuckPaymentsAsync(CancellationToken ct)
        {
            var checkThreshold = DateTime.UtcNow.AddMinutes(-35);
            
            var stuckPayments = await _context.Payments
                .Include(p => p.UserSubscription)
                .Where(p => p.Status == PaymentStatus.Pending && p.PaymentDate < checkThreshold)
                .ToListAsync(ct);

            if (!stuckPayments.Any()) return 0;

            _logger.LogInformation("Found {Count} stuck payments. Verifying with bePaid...", stuckPayments.Count);

            int updatedCount = 0;

            foreach (var payment in stuckPayments)
            {
                try
                {
                    var remoteStatus = await _gatewayService.CheckPaymentStatusAsync(payment.Id.ToString());

                    if (remoteStatus.HasValue)
                    {
                        if (remoteStatus.Value != PaymentStatus.Pending)
                        {
                            payment.Status = remoteStatus.Value;
                            if (payment.Status == PaymentStatus.Completed && payment.UserSubscription != null)
                            {
                                payment.UserSubscription.IsActive = true;
                            }
                            updatedCount++;
                        }
                    }
                    else
                    {                        
                        payment.Status = PaymentStatus.Failed;
                        updatedCount++;
                        _logger.LogInformation("Payment {Id} has no transactions in bePaid and exceeded timeout. Marking as Failed.", payment.Id);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing stuck payment {Id}", payment.Id);
                }
            }

            if (updatedCount > 0)
            {
                await _context.SaveChangesAsync(ct);
            }

            return updatedCount;
        }
    }
}