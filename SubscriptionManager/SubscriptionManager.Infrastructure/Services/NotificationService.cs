using Microsoft.EntityFrameworkCore;
using SubscriptionManager.Core.DTOs;
using SubscriptionManager.Core.Models;
using SubscriptionManager.Infrastructure.Data;

namespace SubscriptionManager.Infrastructure.Services
{
    public interface INotificationService
    {
        Task CreateAsync(Guid userId, string title, string message, NotificationType type);
        Task<List<NotificationDto>> GetUserNotificationsAsync(Guid userId);
        Task MarkAsReadAsync(Guid notificationId, Guid userId);
    }

    public class NotificationService : INotificationService
    {
        private readonly SubscriptionsDbContext _context;

        public NotificationService(SubscriptionsDbContext context)
        {
            _context = context;
        }

        public async Task CreateAsync(Guid userId, string title, string message, NotificationType type)
        {
            var notification = new Notification
            {
                UserId = userId,
                Title = title,
                Message = message,
                Type = type,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
        }

        public async Task<List<NotificationDto>> GetUserNotificationsAsync(Guid userId)
        {
            return await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new NotificationDto
                {
                    Id = n.Id,
                    Title = n.Title,
                    Message = n.Message,
                    Type = n.Type.ToString(),
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt
                })
                .ToListAsync();
        }

        public async Task MarkAsReadAsync(Guid notificationId, Guid userId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification != null)
            {
                notification.IsRead = true;
                await _context.SaveChangesAsync();
            }
        }
    }
}