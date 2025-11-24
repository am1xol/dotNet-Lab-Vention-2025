using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SubscriptionManager.Core;
using SubscriptionManager.Core.DTOs;
using SubscriptionManager.Core.Models;
using SubscriptionManager.Infrastructure.Data;
using SubscriptionManager.Infrastructure.Services;
using System.Security.Claims;

namespace SubscriptionManager.Subscriptions.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SubscriptionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IFileStorageService _fileStorageService;

        public SubscriptionsController(ApplicationDbContext context, IFileStorageService fileStorageService)
        {
            _context = context;
            _fileStorageService = fileStorageService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(Dictionary<string, List<SubscriptionDto>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<Dictionary<string, List<SubscriptionDto>>>> GetSubscriptions()
        {
            var subscriptions = await _context.Subscriptions
                .Where(s => s.IsActive)
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
                var activeUserSubscriptions = await _context.UserSubscriptions
                    .Where(us => us.SubscriptionId == id && us.IsActive)
                    .ToListAsync();

                foreach (var userSubscription in activeUserSubscriptions)
                {
                    userSubscription.CancelledAt = DateTime.UtcNow;
                    userSubscription.ValidUntil = userSubscription.NextBillingDate;
                }
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