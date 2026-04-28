using System.Threading.Channels;

namespace SubscriptionManager.Auth.API.Services;

public class AdminSupportNotificationQueue : IAdminSupportNotificationQueue
{
    private readonly Channel<AdminSupportNotificationJob> _channel;

    public AdminSupportNotificationQueue()
    {
        _channel = Channel.CreateUnbounded<AdminSupportNotificationJob>(new UnboundedChannelOptions
        {
            SingleReader = true,
            SingleWriter = false
        });
    }

    public ValueTask EnqueueAsync(AdminSupportNotificationJob job, CancellationToken cancellationToken = default)
    {
        return _channel.Writer.WriteAsync(job, cancellationToken);
    }

    public IAsyncEnumerable<AdminSupportNotificationJob> DequeueAllAsync(CancellationToken cancellationToken)
    {
        return _channel.Reader.ReadAllAsync(cancellationToken);
    }
}
