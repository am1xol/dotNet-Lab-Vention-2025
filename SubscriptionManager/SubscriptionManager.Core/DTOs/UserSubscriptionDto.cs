using SubscriptionManager.Core.Validation;

namespace SubscriptionManager.Core.DTOs
{
    public class UserSubscriptionDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
		public Guid SubscriptionPriceId { get; set; }
		public Guid SubscriptionId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime NextBillingDate { get; set; }
        public DateTime? CancelledAt { get; set; }
        public DateTime? ValidUntil { get; set; }
        public bool IsActive { get; set; }
        public bool IsFrozen { get; set; }
        public DateTime? FrozenAt { get; set; }
        public DateTime? FrozenUntil { get; set; }
        public bool IsValid { get; set; }
        public string? Status { get; set; }
        public SubscriptionDto Subscription { get; set; } = null!;
		public string PeriodName { get; set; } = string.Empty;
		public decimal FinalPrice { get; set; }
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

    public class UnsubscribeRequest
    {
        public string? Reason { get; set; }
        [NoLeadingWhitespace(ErrorMessage = "Custom reason cannot start with spaces, tabs, or line breaks")]
        public string? CustomReason { get; set; }
    }

    public class FreezeSubscriptionRequest
    {
        public int FreezeMonths { get; set; } = 1;
    }
}
