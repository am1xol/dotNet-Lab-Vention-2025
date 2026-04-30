using Microsoft.AspNetCore.SignalR;
using SubscriptionManager.Core.DTOs;
using SubscriptionManager.Core.Interfaces;

namespace SubscriptionManager.Subscriptions.API.Realtime;

public class SignalRNotificationRealtimePublisher : INotificationRealtimePublisher
{
    private readonly IHubContext<NotificationsHub> _hubContext;

    public SignalRNotificationRealtimePublisher(IHubContext<NotificationsHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public Task PublishCreatedAsync(Guid userId, NotificationDto notification, CancellationToken cancellationToken = default)
    {
        return _hubContext.Clients
            .Group(NotificationsHubGroups.User(userId))
            .SendAsync(NotificationsHubEvents.NotificationCreated, notification, cancellationToken);
    }
}
