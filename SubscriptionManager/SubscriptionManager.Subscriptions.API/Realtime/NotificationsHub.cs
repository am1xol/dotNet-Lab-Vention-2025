using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace SubscriptionManager.Subscriptions.API.Realtime;

[Authorize]
public class NotificationsHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrWhiteSpace(userIdClaim) && Guid.TryParse(userIdClaim, out var userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, NotificationsHubGroups.User(userId));
        }

        await base.OnConnectedAsync();
    }
}
