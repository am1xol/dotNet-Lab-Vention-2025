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
    public class UserSubscriptionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IFileStorageService _fileStorageService;

        public UserSubscriptionsController(ApplicationDbContext context, IFileStorageService fileStorageService)
        {
            _context = context;
            _fileStorageService = fileStorageService;
        }

        [HttpPost("subscribe/{subscriptionId}")]
        [ProducesResponseType(typeof(SubscribeResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<SubscribeResponse>> Subscribe(Guid subscriptionId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized("Invalid user ID in token");
            }

            var subscription = await _context.Subscriptions.FindAsync(subscriptionId);
            if (subscription == null || !subscription.IsActive)
            {
                return NotFound("Subscription not found");
            }

            var existingSubscription = await _context.UserSubscriptions
                .FirstOrDefaultAsync(us => us.UserId == userId && us.SubscriptionId == subscriptionId && us.IsActive);

            if (existingSubscription != null)
            {
                return BadRequest("User already subscribed to this service");
            }

            var userSubscription = new UserSubscription
            {
                UserId = userId,
                SubscriptionId = subscriptionId,
                StartDate = DateTime.UtcNow,
                NextBillingDate = CalculateNextBillingDate(subscription.Period),
                IsActive = true
            };

            _context.UserSubscriptions.Add(userSubscription);
            await _context.SaveChangesAsync();

            return Ok(new SubscribeResponse
            {
                Id = userSubscription.Id,
                UserId = userSubscription.UserId,
                SubscriptionId = userSubscription.SubscriptionId,
                StartDate = userSubscription.StartDate,
                NextBillingDate = userSubscription.NextBillingDate,
                IsActive = userSubscription.IsActive
            });
        }

        [HttpGet("my-subscriptions")]
        [ProducesResponseType(typeof(Dictionary<string, List<UserSubscriptionDto>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<Dictionary<string, List<UserSubscriptionDto>>>> GetMySubscriptions()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized("Invalid user ID in token");
            }

            var currentDate = DateTime.UtcNow;

            var userSubscriptions = await _context.UserSubscriptions
                .Where(us => us.UserId == userId &&
                             us.IsActive &&
                             (!us.CancelledAt.HasValue || currentDate <= us.ValidUntil))
                .Include(us => us.Subscription)
                .Select(us => new UserSubscriptionDto
                {
                    Id = us.Id,
                    UserId = us.UserId,
                    SubscriptionId = us.SubscriptionId,
                    StartDate = us.StartDate,
                    NextBillingDate = us.NextBillingDate,
                    CancelledAt = us.CancelledAt,
                    ValidUntil = us.ValidUntil,
                    IsActive = us.IsActive,
                    IsValid = us.IsValid,
                    Subscription = new SubscriptionDto
                    {
                        Id = us.Subscription.Id,
                        Name = us.Subscription.Name,
                        Description = us.Subscription.Description,
                        Price = us.Subscription.Price,
                        Period = us.Subscription.Period,
                        Category = us.Subscription.Category,
                        IconFileId = us.Subscription.IconFileId,
                        IconUrl = null,
                        IsActive = us.Subscription.IsActive,
                        CreatedAt = us.Subscription.CreatedAt,
                        UpdatedAt = us.Subscription.UpdatedAt
                    }
                })
                .ToListAsync();

            foreach (var userSubscription in userSubscriptions)
            {
                if (userSubscription.Subscription.IconFileId.HasValue)
                {
                    try
                    {
                        userSubscription.Subscription.IconUrl = await _fileStorageService.GetPresignedUrlAsync(
                            userSubscription.Subscription.IconFileId.Value);
                    }
                    catch
                    {
                        userSubscription.Subscription.IconUrl = null;
                    }
                }
            }

            var groupedSubscriptions = userSubscriptions
                .GroupBy(us => us.Subscription.Category)
                .ToDictionary(g => g.Key, g => g.ToList());

            return Ok(groupedSubscriptions);
        }

        [HttpPost("unsubscribe/{subscriptionId}")]
        public async Task<IActionResult> Unsubscribe(Guid subscriptionId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized("Invalid user ID in token");
            }

            var userSubscription = await _context.UserSubscriptions
                .FirstOrDefaultAsync(us => us.UserId == userId && us.SubscriptionId == subscriptionId && us.IsActive);

            if (userSubscription == null)
            {
                return NotFound("Subscription not found");
            }

            userSubscription.CancelledAt = DateTime.UtcNow;

            userSubscription.ValidUntil = userSubscription.NextBillingDate;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Subscription cancelled successfully",
                ValidUntil = userSubscription.ValidUntil
            });
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
