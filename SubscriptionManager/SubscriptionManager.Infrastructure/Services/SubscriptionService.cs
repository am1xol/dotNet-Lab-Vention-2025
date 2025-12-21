using Microsoft.EntityFrameworkCore;
using SubscriptionManager.Core.DTOs;
using SubscriptionManager.Infrastructure.Data;
using AutoMapper;
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
        private readonly SubscriptionsDbContext _context;
        private readonly IMapper _mapper;

        public SubscriptionService(SubscriptionsDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
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

        public async Task<PagedResult<SubscriptionDto>> GetSubscriptionsAsync(PaginationParams pq)
        {
            var query = _context.Subscriptions.AsQueryable();

            query = pq.OrderBy?.ToLower() switch
            {
                "name" => query.OrderBy(s => s.Name),
                "price" => query.OrderBy(s => s.Price),
                _ => query.OrderBy(s => s.Id)
            };

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((pq.PageNumber - 1) * pq.PageSize)
                .Take(pq.PageSize)
                .ToListAsync();

            return new PagedResult<SubscriptionDto>
            {
                Items = _mapper.Map<IEnumerable<SubscriptionDto>>(items),
                TotalCount = totalCount,
                PageNumber = pq.PageNumber,
                PageSize = pq.PageSize
            };
        }
    }
}
