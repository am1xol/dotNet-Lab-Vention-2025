using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SubscriptionManager.Core
{
    public class UserSubscription
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid UserId { get; set; }
        public Guid SubscriptionId { get; set; }

        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime NextBillingDate { get; set; }
        public DateTime? CancelledAt { get; set; }
        public DateTime? ValidUntil { get; set; }

        public bool IsActive { get; set; } = true;

        public virtual Subscription Subscription { get; set; } = null!;
        public bool IsValid => IsActive && (!CancelledAt.HasValue || DateTime.UtcNow <= ValidUntil);
    }
}
