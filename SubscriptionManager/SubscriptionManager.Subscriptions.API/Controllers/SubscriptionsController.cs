using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using SubscriptionManager.Core.Models;
using SubscriptionManager.Infrastructure.Data;
using SubscriptionManager.Core;

namespace SubscriptionManager.Subscriptions.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SubscriptionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SubscriptionsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<Dictionary<string, List<Subscription>>>> GetSubscriptions()
        {
            var subscriptions = await _context.Subscriptions
                .Where(s => s.IsActive)
                .ToListAsync();

            var groupedSubscriptions = subscriptions
                .GroupBy(s => s.Category)
                .ToDictionary(g => g.Key, g => g.ToList());

            return Ok(groupedSubscriptions);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Subscription>> GetSubscription(Guid id)
        {
            var subscription = await _context.Subscriptions.FindAsync(id);

            if (subscription == null || !subscription.IsActive)
            {
                return NotFound();
            }

            return subscription;
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Subscription>> CreateSubscription(Subscription subscription)
        {
            subscription.Id = Guid.NewGuid();
            subscription.CreatedAt = DateTime.UtcNow;
            subscription.UpdatedAt = DateTime.UtcNow;

            _context.Subscriptions.Add(subscription);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSubscription), new { id = subscription.Id }, subscription);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateSubscription(Guid id, Subscription subscription)
        {
            if (id != subscription.Id)
            {
                return BadRequest();
            }

            var existingSubscription = await _context.Subscriptions.FindAsync(id);
            if (existingSubscription == null)
            {
                return NotFound();
            }

            existingSubscription.Name = subscription.Name;
            existingSubscription.Description = subscription.Description;
            existingSubscription.Price = subscription.Price;
            existingSubscription.Period = subscription.Period;
            existingSubscription.Category = subscription.Category;
            existingSubscription.IconUrl = subscription.IconUrl;
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

            subscription.IsActive = false;
            subscription.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
