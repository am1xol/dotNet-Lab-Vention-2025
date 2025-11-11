using Microsoft.EntityFrameworkCore;
using SubscriptionManager.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SubscriptionManager.Infrastructure.Services
{
    public interface ISubscriptionService
    {
        Task ProcessExpiredSubscriptionsAsync();
    }
    public class SubscriptionService : ISubscriptionService
    {
        private readonly ApplicationDbContext _context;

        public SubscriptionService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task ProcessExpiredSubscriptionsAsync()
        {
            var now = DateTime.UtcNow;

            var expiredSubscriptions = await _context.UserSubscriptions
                .Where(us => us.IsActive &&
                       ((us.CancelledAt.HasValue && us.ValidUntil.HasValue && us.ValidUntil <= now) ||
                        (!us.CancelledAt.HasValue && us.NextBillingDate <= now)))
                .ToListAsync();

            foreach (var subscription in expiredSubscriptions)
            {
                if (subscription.CancelledAt.HasValue)
                {
                    subscription.IsActive = false;
                }
                else
                {
                    subscription.NextBillingDate = CalculateNextBillingDate(
                        subscription.Subscription?.Period ?? "monthly");
                }
            }

            await _context.SaveChangesAsync();
        }

        private DateTime CalculateNextBillingDate(string period)
        {
            return period.ToLower() switch
            {
                "monthly" => DateTime.UtcNow.AddMonths(1),
                "quarterly" => DateTime.UtcNow.AddMonths(3),
                "yearly" => DateTime.UtcNow.AddYears(1),
                "lifetime" => DateTime.UtcNow.AddYears(100),
                _ => DateTime.UtcNow.AddMonths(1)
            };
        }
    }
}
