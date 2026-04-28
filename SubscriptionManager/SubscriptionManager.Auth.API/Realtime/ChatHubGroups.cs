namespace SubscriptionManager.Auth.API.Realtime;

public static class ChatHubGroups
{
    public const string Admins = "admins";

    public static string User(Guid userId) => $"user:{userId:D}";
}
