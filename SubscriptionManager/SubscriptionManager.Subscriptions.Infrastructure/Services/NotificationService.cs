using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SubscriptionManager.Auth.Infrastructure.Data;
using SubscriptionManager.Core.DTOs;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Models;
using SubscriptionManager.Subscriptions.Infrastructure.Data;

namespace SubscriptionManager.Subscriptions.Infrastructure.Services
{
    public interface INotificationService
    {
        Task CreateAsync(Guid userId, string title, string message, NotificationType type);
        Task<List<NotificationDto>> GetUserNotificationsAsync(Guid userId);
        Task<PagedNotificationsDto> GetPagedNotificationsAsync(Guid userId, int page, int pageSize);
        Task MarkAsReadAsync(Guid notificationId, Guid userId);
        Task MarkAllAsReadAsync(Guid userId);
    }

    public class NotificationService : INotificationService
    {
        private readonly SubscriptionsDbContext _context;
        private readonly AuthDbContext _authContext;
        private readonly IEmailService _emailService;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(SubscriptionsDbContext context, AuthDbContext authContext, IEmailService emailService, ILogger<NotificationService> logger)
        {
            _context = context;
            _authContext = authContext;
            _emailService = emailService;
            _logger = logger;
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

            try
            {
                var userEmail = await _authContext.Users
                    .Where(u => u.Id == userId)
                    .Select(u => u.Email)
                    .FirstOrDefaultAsync();

                if (!string.IsNullOrEmpty(userEmail))
                {
                    await _emailService.SendNotificationEmailAsync(userEmail, title, message);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email notification");
            }
        }

        public async Task<PagedNotificationsDto> GetPagedNotificationsAsync(Guid userId, int page, int pageSize)
        {
            var query = _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt);

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
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

            return new PagedNotificationsDto
            {
                Items = items,
                TotalCount = totalCount
            };
        }

        public async Task MarkAllAsReadAsync(Guid userId)
        {
            await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(n => n.IsRead, true));
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