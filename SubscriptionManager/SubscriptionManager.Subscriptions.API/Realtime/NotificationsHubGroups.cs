namespace SubscriptionManager.Subscriptions.API.Realtime;

public static class NotificationsHubGroups
{
    public static string User(Guid userId) => $"user:{userId:D}";
}
