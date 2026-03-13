using SubscriptionManager.Core.Models;

namespace SubscriptionManager.Core
{
    public class UserSubscription
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid UserId { get; set; }
        public Guid SubscriptionPriceId { get; set; }

        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime NextBillingDate { get; set; }
        public DateTime? CancelledAt { get; set; }
        public DateTime? ValidUntil { get; set; }

        public bool IsActive { get; set; } = true;

        public virtual SubscriptionPrice SubscriptionPrice { get; set; } = null!;
        public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();

        public bool IsValid => IsActive && (!CancelledAt.HasValue || DateTime.UtcNow <= ValidUntil);
    }
}
