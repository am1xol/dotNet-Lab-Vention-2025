namespace SubscriptionManager.Auth.API.Services;

public interface IAdminSupportNotificationQueue
{
    ValueTask EnqueueAsync(AdminSupportNotificationJob job, CancellationToken cancellationToken = default);
    IAsyncEnumerable<AdminSupportNotificationJob> DequeueAllAsync(CancellationToken cancellationToken);
}
