namespace SubscriptionManager.Auth.API.Services;

public sealed record AdminSupportNotificationJob(Guid SenderUserId, string MessageContent);
