using AutoMapper;
using Microsoft.EntityFrameworkCore;
using SubscriptionManager.Core.DTOs;
using SubscriptionManager.Subscriptions.Infrastructure.Data;

namespace SubscriptionManager.Subscriptions.Infrastructure.Services
{
    public interface ISubscriptionService
    {
        Task ProcessExpiredSubscriptionsAsync();
    }
    public class SubscriptionService : ISubscriptionService
    {
        private readonly SubscriptionsDbContext _context;
        private readonly IMapper _mapper;
        private readonly IFileStorageService _fileStorageService;

        public SubscriptionService(SubscriptionsDbContext context, IMapper mapper, IFileStorageService fileStorageService)
        {
            _context = context;
            _mapper = mapper;
            _fileStorageService = fileStorageService;
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

        public async Task<PagedResult<SubscriptionDto>> GetSubscriptionsAsync(PaginationParams pq, string? category = null)
        {
            var query = _context.Subscriptions
                .Where(s => s.IsActive)
                .AsQueryable();

            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(s => s.Category == category);
            }

            query = pq.OrderBy?.ToLower() switch
            {
                "name" => query.OrderBy(s => s.Name),
                "price" => query.OrderBy(s => s.Price),
                _ => query.OrderByDescending(s => s.CreatedAt)
            };

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((pq.PageNumber - 1) * pq.PageSize)
                .Take(pq.PageSize)
                .ToListAsync();

            var dtos = _mapper.Map<IEnumerable<SubscriptionDto>>(items);

            foreach (var dto in dtos)
            {
                if (dto.IconFileId.HasValue)
                {
                    try
                    {
                        dto.IconUrl = await _fileStorageService.GetPresignedUrlAsync(dto.IconFileId.Value);
                    }
                    catch
                    {
                        dto.IconUrl = null;
                    }
                }
            }

            return new PagedResult<SubscriptionDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = pq.PageNumber,
                PageSize = pq.PageSize
            };
        }
    }
}
