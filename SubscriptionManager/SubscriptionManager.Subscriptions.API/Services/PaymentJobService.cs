using SubscriptionManager.Core;
using SubscriptionManager.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace SubscriptionManager.Subscriptions.API.Services
{
    public interface IPaymentJobService
    {
        Task<int> CleanupStuckPaymentsAsync(CancellationToken ct);
    }
    public class PaymentJobService : IPaymentJobService
    {
        private readonly SubscriptionsDbContext _context;
        private readonly ILogger<PaymentJobService> _logger;

        public PaymentJobService(SubscriptionsDbContext context, ILogger<PaymentJobService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<int> CleanupStuckPaymentsAsync(CancellationToken ct)
        {
            var threshold = DateTime.UtcNow.AddMinutes(-1);

            var stuckPayments = await _context.Payments
                .Include(p => p.UserSubscription)
                .Where(p => p.Status == PaymentStatus.Pending && p.PaymentDate < threshold)
                .ToListAsync(ct);

            if (!stuckPayments.Any()) return 0;

            _logger.LogInformation("Найдено {Count} просроченных платежей. Очистка...", stuckPayments.Count);

            foreach (var payment in stuckPayments)
            {
                payment.Status = PaymentStatus.Failed;

                _context.Payments.Remove(payment);

                if (payment.UserSubscription != null && !payment.UserSubscription.IsActive)
                {
                    _context.UserSubscriptions.Remove(payment.UserSubscription);
                }
            }

            return await _context.SaveChangesAsync(ct);
        }
    }
}
