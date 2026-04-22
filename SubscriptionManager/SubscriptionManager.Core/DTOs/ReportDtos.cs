namespace SubscriptionManager.Core.DTOs
{
    public class UserActivityByPeriodDto
    {
        public Guid UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public int SuccessfulPaymentsCount { get; set; }
        public decimal TotalSpent { get; set; }
        public int SubscriptionsStartedCount { get; set; }
        public int SubscriptionsCancelledCount { get; set; }
        public DateTime? LastActivityAt { get; set; }
    }

    public class SubscriptionsByPeriodDto
    {
        public Guid SubscriptionId { get; set; }
        public string SubscriptionName { get; set; } = string.Empty;
        public Guid PeriodId { get; set; }
        public string PeriodName { get; set; } = string.Empty;
        public int NewSubscriptionsCount { get; set; }
        public int ActiveSubscribersCount { get; set; }
        public int SuccessfulPaymentsCount { get; set; }
        public decimal Revenue { get; set; }
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

    public class AdminAnalyticsDashboardDto
    {
        public int ActiveUsersCount { get; set; }
        public int NewSubscriptionsCount { get; set; }
        public int CancelledSubscriptionsCount { get; set; }
        public int PaidSubscriptionsCount { get; set; }
        public int ExpiringSubscriptionsCount { get; set; }
        public int SuccessfulPaymentsCount { get; set; }
        public int FailedPaymentsCount { get; set; }
        public List<CategoryDistributionItemDto> CategoryDistribution { get; set; } = new();
    }

    public class CategoryDistributionItemDto
    {
        public string Category { get; set; } = string.Empty;
        public int SubscriptionsCount { get; set; }
    }
}

