using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SubscriptionManager.Core;
using SubscriptionManager.Core.Models;
using SubscriptionManager.Infrastructure.Data;
using System.Security.Claims;

namespace SubscriptionManager.Subscriptions.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UserSubscriptionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UserSubscriptionsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost("subscribe/{subscriptionId}")]
        public async Task<ActionResult<UserSubscription>> Subscribe(Guid subscriptionId)
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

            return Ok(userSubscription);
        }

        [HttpGet("my-subscriptions")]
        public async Task<ActionResult<Dictionary<string, List<UserSubscription>>>> GetMySubscriptions()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized("Invalid user ID in token");
            }

            var currentDate = DateTime.UtcNow;

            var subscriptions = await _context.UserSubscriptions
                .Where(us => us.UserId == userId &&
                             us.IsActive &&
                             (!us.CancelledAt.HasValue || currentDate <= us.ValidUntil))
                .Include(us => us.Subscription)
                .ToListAsync();

            Console.WriteLine($"Valid subscriptions: {subscriptions.Count}");

            var groupedSubscriptions = subscriptions
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
