using SubscriptionManager.Core;
using SubscriptionManager.Core.Models;
using SubscriptionManager.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Infrastructure.Services;

namespace SubscriptionManager.Subscriptions.API.Services
{
    public interface IPaymentJobService
    {
        Task<int> CleanupStuckPaymentsAsync(CancellationToken ct);
        Task CheckExpiringSubscriptionsAsync(CancellationToken ct);
    }
    public class PaymentJobService : IPaymentJobService
    {
        private readonly SubscriptionsDbContext _context;
        private readonly IPaymentGatewayService _gatewayService;
        private readonly INotificationService _notificationService;
        private readonly ILogger<PaymentJobService> _logger;

        public PaymentJobService(SubscriptionsDbContext context, IPaymentGatewayService gatewayService, INotificationService notificationService, ILogger<PaymentJobService> logger)
        {
            _context = context;
            _gatewayService = gatewayService;
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task<int> CleanupStuckPaymentsAsync(CancellationToken ct)
        {
            var checkThreshold = DateTime.UtcNow.AddMinutes(-35);
            
            var stuckPayments = await _context.Payments
                .Include(p => p.UserSubscription)
                    .ThenInclude(us => us.Subscription)
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
                            else if (payment.Status == PaymentStatus.Failed)
                            {
                                await _notificationService.CreateAsync(
                                    payment.UserId,
                                    "Ошибка оплаты",
                                    $"Не удалось продлить подписку '{payment.UserSubscription?.Subscription?.Name}'. Платеж отклонен платежной системой.",
                                    NotificationType.Error
                                );
                            }

                            updatedCount++;
                        }
                    }
                    else
                    {                        
                        payment.Status = PaymentStatus.Failed;
                        
                        await _notificationService.CreateAsync(
                            payment.UserId,
                            "Время ожидания истекло",
                            $"Платеж для подписки '{payment.UserSubscription?.Subscription?.Name}' был отменен из-за истечения времени ожидания.",
                            NotificationType.Error
                        );

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

        public async Task CheckExpiringSubscriptionsAsync(CancellationToken ct)
        {
            var now = DateTime.UtcNow;

            var expiredSubscriptions = await _context.UserSubscriptions
                .Include(us => us.Subscription)
                .Where(us => us.IsActive 
                             && us.NextBillingDate < now 
                             && (!us.ValidUntil.HasValue || us.ValidUntil < now))
                .ToListAsync(ct);

            foreach (var sub in expiredSubscriptions)
            {
                sub.IsActive = false;

                await _notificationService.CreateAsync(
                    sub.UserId,
                    "Подписка истекла",
                    $"Срок действия вашей подписки '{sub.Subscription.Name}' истек. Пожалуйста, продлите её, чтобы продолжить пользоваться сервисом.",
                    NotificationType.Warning
                );

                _logger.LogInformation("Subscription {Id} marked as expired for User {UserId}", sub.Id, sub.UserId);
            }

            if (expiredSubscriptions.Any())
            {
                await _context.SaveChangesAsync(ct);
            }
        }
    }
}