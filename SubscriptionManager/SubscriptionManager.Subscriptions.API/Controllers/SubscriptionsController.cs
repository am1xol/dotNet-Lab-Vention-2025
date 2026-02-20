using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SubscriptionManager.Core;
using SubscriptionManager.Core.DTOs;
using SubscriptionManager.Subscriptions.Infrastructure.Data;
using SubscriptionManager.Subscriptions.Infrastructure.Services;

namespace SubscriptionManager.Subscriptions.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SubscriptionsController : ControllerBase
    {
        private readonly SubscriptionsDbContext _context;
        private readonly IFileStorageService _fileStorageService;

        public SubscriptionsController(SubscriptionsDbContext context, IFileStorageService fileStorageService)
        {
            _context = context;
            _fileStorageService = fileStorageService;
        }

        [HttpGet("categories")]
        public async Task<ActionResult<List<string>>> GetCategories()
        {
            var categories = await _context.Subscriptions
                .Where(s => s.IsActive)
                .Select(s => s.Category)
                .Distinct()
                .ToListAsync();

            return Ok(categories);
        }

        [HttpGet]
        [ProducesResponseType(typeof(PagedResult<SubscriptionDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<PagedResult<SubscriptionDto>>> GetSubscriptions(
            [FromQuery] PaginationParams pq,
            [FromQuery] string? category = null,
            [FromQuery] string? search = null,
            [FromQuery] string? period = null,
            [FromQuery] decimal? minPrice = null,
            [FromQuery] decimal? maxPrice = null,
            [FromQuery] string? orderBy = null,
            [FromQuery] bool? descending = null)
        {
            var query = _context.Subscriptions
                .Where(s => s.IsActive)
                .AsQueryable();

            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(s => s.Category == category);
            }

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(s =>
                    s.Name.Contains(search) ||
                    s.Description.Contains(search));
            }

            if (!string.IsNullOrEmpty(period))
            {
                var periods = period.Split(',', StringSplitOptions.RemoveEmptyEntries);
                query = query.Where(s => periods.Contains(s.Period));
            }

            if (minPrice.HasValue)
            {
                query = query.Where(s => s.Price >= minPrice.Value);
            }

            if (maxPrice.HasValue)
            {
                query = query.Where(s => s.Price <= maxPrice.Value);
            }

            if (!string.IsNullOrEmpty(orderBy))
            {
                query = orderBy.ToLower() switch
                {
                    "name" => descending.HasValue && descending.Value ?
                        query.OrderByDescending(s => s.Name) :
                        query.OrderBy(s => s.Name),
                    "price" => descending.HasValue && descending.Value ?
                        query.OrderByDescending(s => s.Price) :
                        query.OrderBy(s => s.Price),
                    "createdat" => descending.HasValue && descending.Value ?
                        query.OrderByDescending(s => s.CreatedAt) :
                        query.OrderBy(s => s.CreatedAt),
                    _ => descending.HasValue && descending.Value ?
                        query.OrderByDescending(s => s.CreatedAt) :
                        query.OrderBy(s => s.CreatedAt)
                };
            }
            else
            {
                query = query.OrderByDescending(s => s.CreatedAt);
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((pq.PageNumber - 1) * pq.PageSize)
                .Take(pq.PageSize)
                .ToListAsync();

            var dtos = items.Select(s => MapToDto(s)).ToList();

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

            return Ok(new PagedResult<SubscriptionDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = pq.PageNumber,
                PageSize = pq.PageSize
            });
        }

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(SubscriptionDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<SubscriptionDto>> GetSubscription(Guid id)
        {
            var subscription = await _context.Subscriptions
                .FirstOrDefaultAsync(s => s.Id == id && s.IsActive);

            if (subscription == null)
            {
                return NotFound();
            }

            var subscriptionDto = MapToDto(subscription);

            if (subscription.IconFileId.HasValue)
            {
                try
                {
                    subscriptionDto.IconUrl = await _fileStorageService.GetPresignedUrlAsync(subscription.IconFileId.Value);
                }
                catch
                {
                    subscriptionDto.IconUrl = null;
                }
            }

            return subscriptionDto;
        }

        [HttpGet("admin/all")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(Dictionary<string, List<SubscriptionDto>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<Dictionary<string, List<SubscriptionDto>>>> GetAllSubscriptionsForAdmin()
        {
            var subscriptions = await _context.Subscriptions
                .Select(s => MapToDto(s))
                .ToListAsync();

            foreach (var subscription in subscriptions)
            {
                if (subscription.IconFileId.HasValue)
                {
                    try
                    {
                        subscription.IconUrl = await _fileStorageService.GetPresignedUrlAsync(subscription.IconFileId.Value);
                    }
                    catch
                    {
                        subscription.IconUrl = null;
                    }
                }
            }

            var groupedSubscriptions = subscriptions
                .GroupBy(s => s.Category)
                .ToDictionary(g => g.Key, g => g.ToList());

            return Ok(groupedSubscriptions);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(SubscriptionDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<SubscriptionDto>> CreateSubscription(CreateSubscriptionRequest request)
        {
            if (request.IconFileId.HasValue)
            {
                var fileExists = await _context.StoredFiles.AnyAsync(f => f.Id == request.IconFileId.Value);
                if (!fileExists)
                {
                    return BadRequest("Icon file not found");
                }
            }

            var subscription = new Subscription
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Description = request.Description,
                DescriptionMarkdown = request.DescriptionMarkdown,
                Price = request.Price,
                Period = request.Period,
                Category = request.Category,
                IconFileId = request.IconFileId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Subscriptions.Add(subscription);
            await _context.SaveChangesAsync();

            var subscriptionDto = MapToDto(subscription);

            if (subscription.IconFileId.HasValue)
            {
                try
                {
                    subscriptionDto.IconUrl = await _fileStorageService.GetPresignedUrlAsync(subscription.IconFileId.Value);
                }
                catch
                {
                    subscriptionDto.IconUrl = null;
                }
            }

            return CreatedAtAction(nameof(GetSubscription), new { id = subscription.Id }, subscriptionDto);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateSubscription(Guid id, UpdateSubscriptionRequest request)
        {
            if (request.IconFileId.HasValue)
            {
                var fileExists = await _context.StoredFiles.AnyAsync(f => f.Id == request.IconFileId.Value);
                if (!fileExists)
                {
                    return BadRequest("Icon file not found");
                }
            }

            var existingSubscription = await _context.Subscriptions.FindAsync(id);
            if (existingSubscription == null)
            {
                return NotFound();
            }

            existingSubscription.Name = request.Name;
            existingSubscription.Description = request.Description;
            existingSubscription.DescriptionMarkdown = request.DescriptionMarkdown;
            existingSubscription.Price = request.Price;
            existingSubscription.Period = request.Period;
            existingSubscription.Category = request.Category;
            existingSubscription.IconFileId = request.IconFileId;
            existingSubscription.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteSubscription(Guid id)
        {
            var subscription = await _context.Subscriptions.FindAsync(id);
            if (subscription == null)
            {
                return NotFound();
            }

            var activeUserSubscriptions = await _context.UserSubscriptions
                .Where(us => us.SubscriptionId == id && us.IsActive)
                .ToListAsync();

            if (activeUserSubscriptions.Any())
            {
                return BadRequest(new
                {
                    message = "Cannot delete subscription with active users. Cancel all user subscriptions first or deactivate instead.",
                    activeUsersCount = activeUserSubscriptions.Count
                });
            }

            var anyUserSubscriptions = await _context.UserSubscriptions
                .AnyAsync(us => us.SubscriptionId == id);

            if (anyUserSubscriptions)
            {

                subscription.IsActive = false;
                subscription.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Subscription deactivated because it has historical user data. It cannot be fully deleted.",
                    subscriptionId = subscription.Id
                });
            }
            else
            {
                _context.Subscriptions.Remove(subscription);
                await _context.SaveChangesAsync();

                return NoContent();
            }
        }

        [HttpPatch("{id}/active")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateSubscriptionActive(Guid id, [FromBody] UpdateActiveRequest request)
        {
            var subscription = await _context.Subscriptions.FindAsync(id);
            if (subscription == null)
            {
                return NotFound();
            }

            if (!request.IsActive && subscription.IsActive)
            {
                await _context.UserSubscriptions
                    .Where(us => us.SubscriptionId == id && us.IsActive)
                    .ExecuteUpdateAsync(setters => setters
                        .SetProperty(us => us.CancelledAt, DateTime.UtcNow)
                        .SetProperty(us => us.ValidUntil, us => us.NextBillingDate));
            }

            subscription.IsActive = request.IsActive;
            subscription.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        public class UpdateActiveRequest
        {
            public bool IsActive { get; set; }
        }

        private static SubscriptionDto MapToDto(Subscription subscription)
        {
            return new SubscriptionDto
            {
                Id = subscription.Id,
                Name = subscription.Name,
                Description = subscription.Description,
                DescriptionMarkdown = subscription.DescriptionMarkdown,
                Price = subscription.Price,
                Period = subscription.Period,
                Category = subscription.Category,
                IconFileId = subscription.IconFileId,
                IconUrl = null,
                IsActive = subscription.IsActive,
                CreatedAt = subscription.CreatedAt,
                UpdatedAt = subscription.UpdatedAt
            };
        }
    }
}