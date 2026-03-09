using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SubscriptionManager.Core.DTOs;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Models;

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
        private readonly string _subscriptionsConnectionString;
        private readonly string _authConnectionString;
        private readonly IUserRepository _userRepository;
        private readonly IEmailService _emailService;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(
            IConfiguration configuration,
            IUserRepository userRepository,
            IEmailService emailService,
            ILogger<NotificationService> logger)
        {
            _subscriptionsConnectionString = configuration.GetConnectionString("SubscriptionsConnection")
                ?? throw new InvalidOperationException("Connection string 'SubscriptionsConnection' not found.");
            _authConnectionString = configuration.GetConnectionString("AuthConnection")
                ?? throw new InvalidOperationException("Connection string 'AuthDb' not found.");
            _userRepository = userRepository;
            _emailService = emailService;
            _logger = logger;
        }

        public async Task CreateAsync(Guid userId, string title, string message, NotificationType type)
        {
            using var connection = new SqlConnection(_subscriptionsConnectionString);
            const string sql = "sp_Notifications_Create";
            await connection.ExecuteAsync(sql, new
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = title,
                Message = message,
                Type = (int)type,
                CreatedAt = DateTime.UtcNow
            }, commandType: CommandType.StoredProcedure);

            try
            {
                using var authConnection = new SqlConnection(_authConnectionString);
                const string getEmailSql = "SELECT Email FROM Users WHERE Id = @UserId";
                var email = await authConnection.QueryFirstOrDefaultAsync<string>(getEmailSql, new { UserId = userId });

                if (!string.IsNullOrEmpty(email))
                {
                    await _emailService.SendNotificationEmailAsync(email, title, message);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email notification for user {UserId}", userId);
            }
        }

        public async Task<PagedNotificationsDto> GetPagedNotificationsAsync(Guid userId, int page, int pageSize)
        {
            using var connection = new SqlConnection(_subscriptionsConnectionString);
            const string sql = "sp_Notifications_GetPaged";
            var parameters = new DynamicParameters();
            parameters.Add("@UserId", userId);
            parameters.Add("@PageNumber", page);
            parameters.Add("@PageSize", pageSize);
            parameters.Add("@TotalCount", dbType: DbType.Int32, direction: ParameterDirection.Output);

            var items = await connection.QueryAsync<NotificationDto>(sql, parameters, commandType: CommandType.StoredProcedure);
            var totalCount = parameters.Get<int>("@TotalCount");

            return new PagedNotificationsDto
            {
                Items = items.ToList(),
                TotalCount = totalCount
            };
        }

        public async Task MarkAllAsReadAsync(Guid userId)
        {
            using var connection = new SqlConnection(_subscriptionsConnectionString);
            const string sql = "sp_Notifications_MarkAllRead";
            await connection.ExecuteAsync(sql, new { UserId = userId }, commandType: CommandType.StoredProcedure);
        }

        public async Task<List<NotificationDto>> GetUserNotificationsAsync(Guid userId)
        {
            using var connection = new SqlConnection(_subscriptionsConnectionString);
            const string sql = "sp_Notifications_GetByUserId";
            var notifications = await connection.QueryAsync<NotificationDto>(sql, new { UserId = userId }, commandType: CommandType.StoredProcedure);
            return notifications.ToList();
        }

        public async Task MarkAsReadAsync(Guid notificationId, Guid userId)
        {
            using var connection = new SqlConnection(_subscriptionsConnectionString);
            const string sql = "sp_Notifications_MarkAsRead";
            await connection.ExecuteAsync(sql, new { Id = notificationId, UserId = userId }, commandType: CommandType.StoredProcedure);
        }
    }
}