using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SubscriptionManager.Core.DTOs
{
    public class UserSubscriptionDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid SubscriptionId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime NextBillingDate { get; set; }
        public DateTime? CancelledAt { get; set; }
        public DateTime? ValidUntil { get; set; }
        public bool IsActive { get; set; }
        public bool IsValid { get; set; }
        public string? Status { get; set; }
        public SubscriptionDto Subscription { get; set; } = null!;
    }

    public class SubscribeRequest
    {
        public Guid SubscriptionId { get; set; }
    }

    public class SubscribeResponse
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid SubscriptionId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime NextBillingDate { get; set; }
        public bool IsActive { get; set; }
        public string Message { get; set; } = "Subscribed successfully";
    }
}
