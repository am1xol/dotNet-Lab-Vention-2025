using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using SubscriptionManager.Core.Constants;
using System.Security.Claims;

namespace SubscriptionManager.Auth.API.Realtime;

[Authorize]
public class ChatHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = Context.User?.FindFirst(ClaimTypes.Role)?.Value;

        if (!string.IsNullOrWhiteSpace(userIdClaim) && Guid.TryParse(userIdClaim, out var userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, ChatHubGroups.User(userId));
        }

        if (string.Equals(role, RoleConstants.Admin, StringComparison.OrdinalIgnoreCase))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, ChatHubGroups.Admins);
        }

        await base.OnConnectedAsync();
    }
}
