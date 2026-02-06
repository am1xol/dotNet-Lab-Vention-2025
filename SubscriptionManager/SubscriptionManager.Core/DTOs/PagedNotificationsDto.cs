using SubscriptionManager.Core.DTOs;

public class PagedNotificationsDto
{
    public List<NotificationDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
}