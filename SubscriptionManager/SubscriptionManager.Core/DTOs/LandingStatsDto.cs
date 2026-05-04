namespace SubscriptionManager.Core.DTOs;

public class LandingStatsDto
{
    public int SubscriptionTypesCount { get; set; }

    public int ActiveUsersCount { get; set; }

    public int? SatisfactionPercent { get; set; }

    public int FeedbackCount { get; set; }
}
