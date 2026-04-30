using SubscriptionManager.Core.DTOs;

namespace SubscriptionManager.Core.Interfaces;

public interface INotificationRealtimePublisher
{
    Task PublishCreatedAsync(Guid userId, NotificationDto notification, CancellationToken cancellationToken = default);
}
