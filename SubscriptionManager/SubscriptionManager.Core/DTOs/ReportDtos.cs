namespace SubscriptionManager.Core.DTOs
{
    public class ActiveSubscriptionsByPlanDto
    {
        public Guid SubscriptionId { get; set; }
        public string SubscriptionName { get; set; } = string.Empty;
        public Guid PeriodId { get; set; }
        public string PeriodName { get; set; } = string.Empty;
        public decimal FinalPrice { get; set; }
        public int ActiveSubscriptionsCount { get; set; }
    }

    public class SubscriptionWithPlansDto
    {
        public Guid SubscriptionId { get; set; }
        public string SubscriptionName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public decimal BasePrice { get; set; }
        public Guid PeriodId { get; set; }
        public string PeriodName { get; set; } = string.Empty;
        public int MonthsCount { get; set; }
        public Guid SubscriptionPriceId { get; set; }
        public decimal FinalPrice { get; set; }
    }

    public class TopPopularSubscriptionDto
    {
        public Guid SubscriptionId { get; set; }
        public string SubscriptionName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int TotalSubscriptionsCount { get; set; }
    }

    public class SubscriptionsByMonthDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public int SubscriptionsCount { get; set; }
    }

    public class UserSubscriptionReportItemDto
    {
        public Guid UserSubscriptionId { get; set; }
        public Guid UserId { get; set; }
        public Guid SubscriptionId { get; set; }
        public string SubscriptionName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string PeriodName { get; set; } = string.Empty;
        public decimal FinalPrice { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime NextBillingDate { get; set; }
        public DateTime? CancelledAt { get; set; }
        public DateTime? ValidUntil { get; set; }
        public bool IsActive { get; set; }
    }
}

