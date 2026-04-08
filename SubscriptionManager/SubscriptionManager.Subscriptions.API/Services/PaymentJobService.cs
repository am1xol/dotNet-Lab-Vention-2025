using Dapper;
using Microsoft.Data.SqlClient;
using SubscriptionManager.Core;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Models;
using SubscriptionManager.Subscriptions.Infrastructure.Services;
using System.Data;

namespace SubscriptionManager.Subscriptions.API.Services
{
    public interface IPaymentJobService
    {
        Task<int> CleanupStuckPaymentsAsync(CancellationToken ct);
        Task CheckExpiringSubscriptionsAsync(CancellationToken ct);
        Task<int> ProcessExpiredFreezesAsync(CancellationToken ct);
        Task SendSubscriptionExpiryRemindersAsync(CancellationToken ct);
    }

    public class PaymentJobService : IPaymentJobService
    {
        private const string ExpiryReminderTitle = "Срок подписки скоро истекает";
        private readonly string _connectionString;
        private readonly IPaymentGatewayService _gatewayService;
        private readonly INotificationService _notificationService;
        private readonly ILogger<PaymentJobService> _logger;

        public PaymentJobService(
            IConfiguration configuration,
            IPaymentGatewayService gatewayService,
            INotificationService notificationService,
            ILogger<PaymentJobService> logger)
        {
            _connectionString = configuration.GetConnectionString("SubscriptionsConnection")
    ?? throw new InvalidOperationException("Connection string 'SubscriptionsConnection' not found.");
            _gatewayService = gatewayService;
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task<int> CleanupStuckPaymentsAsync(CancellationToken ct)
        {
            using var connection = new SqlConnection(_connectionString);
            
            var stuckPayments = await connection.QueryAsync<Payment>(
                "sp_Jobs_GetStuckPayments", 
                commandType: System.Data.CommandType.StoredProcedure);

            var stuckList = stuckPayments.ToList();
            if (!stuckList.Any()) return 0;

            int updatedCount = 0;
            foreach (var payment in stuckList)
            {
                try
                {
                    var remoteStatus = await _gatewayService.CheckPaymentStatusAsync(payment.Id.ToString());
                    
                    var finalStatus = remoteStatus ?? PaymentStatus.Failed;

                    if (finalStatus == PaymentStatus.Pending) continue;

                    var result = await connection.QueryFirstOrDefaultAsync<dynamic>(
                        "sp_Payments_SyncStatus",
                        new { PaymentId = payment.Id, Status = (int)finalStatus },
                        commandType: System.Data.CommandType.StoredProcedure
                    );

                    if (result == null) continue;

                    if (finalStatus == PaymentStatus.Failed)
                    {
                        string reason = remoteStatus.HasValue ? "Платеж отклонен" : "Время ожидания истекло";
                        await _notificationService.CreateAsync(
                            (Guid)result.UserId,
                            "Ошибка оплаты",
                            $"{reason} для подписки '{result.SubscriptionName}'.",
                            NotificationType.Error
                        );
                    }

                    updatedCount++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing stuck payment {Id}", payment.Id);
                }
            }

            return updatedCount;
        }

        public async Task CheckExpiringSubscriptionsAsync(CancellationToken ct)
        {
            using var connection = new SqlConnection(_connectionString);

            var expiredItems = await connection.QueryAsync<dynamic>(
                "sp_Jobs_ProcessExpiredSubscriptions",
                commandType: CommandType.StoredProcedure);

            foreach (var item in expiredItems)
            {
                Guid userId = (Guid)item.UserId;
                string subName = (string)item.SubscriptionName;

                try
                {
                    await _notificationService.CreateAsync(
                        userId,
                        "Подписка истекла",
                        $"Срок действия вашей подписки '{subName}' истек. Пожалуйста, продлите её, чтобы продолжить пользоваться сервисом.",
                        NotificationType.Warning
                    );

                    _logger.LogInformation("Notified user {UserId} about expired subscription {SubName}",
                        userId, subName);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error sending expiration notification to user {UserId}", userId);
                }
            }
        }

        public async Task SendSubscriptionExpiryRemindersAsync(CancellationToken ct)
        {
            using var connection = new SqlConnection(_connectionString);

            var reminders = await connection.QueryAsync<SubscriptionExpiryReminderItem>(
                """
                SELECT
                    us.Id AS UserSubscriptionId,
                    us.UserId,
                    s.Name AS SubscriptionName,
                    us.NextBillingDate,
                    ISNULL(NULLIF(u.SubscriptionExpiryReminderDays, 0), 3) AS ReminderDays
                FROM UserSubscriptions us
                INNER JOIN SubscriptionPrices sp ON us.SubscriptionPriceId = sp.Id
                INNER JOIN Subscriptions s ON sp.SubscriptionId = s.Id
                INNER JOIN AuthDb.dbo.Users u ON u.Id = us.UserId
                WHERE us.IsActive = 1
                  AND us.CancelledAt IS NULL
                  AND us.NextBillingDate > GETUTCDATE()
                  AND CAST(us.NextBillingDate AS DATE) = DATEADD(
                        DAY,
                        ISNULL(NULLIF(u.SubscriptionExpiryReminderDays, 0), 3),
                        CAST(GETUTCDATE() AS DATE)
                    );
                """);

            foreach (var item in reminders)
            {
                ct.ThrowIfCancellationRequested();

                var message =
                    $"Подписка '{item.SubscriptionName}' истекает {item.NextBillingDate:dd.MM.yyyy}. " +
                    $"Напоминаем за {item.ReminderDays} дн.";

                var wasSentToday = await connection.ExecuteScalarAsync<int>(
                    """
                    SELECT COUNT(1)
                    FROM Notifications
                    WHERE UserId = @UserId
                      AND Title = @Title
                      AND Message = @Message
                      AND CreatedAt >= CAST(GETUTCDATE() AS DATE);
                    """,
                    new
                    {
                        item.UserId,
                        Title = ExpiryReminderTitle,
                        Message = message
                    });

                if (wasSentToday > 0)
                {
                    continue;
                }

                try
                {
                    await _notificationService.CreateAsync(
                        item.UserId,
                        ExpiryReminderTitle,
                        message,
                        NotificationType.Warning
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "Error sending expiry reminder for user {UserId}, subscription {UserSubscriptionId}",
                        item.UserId,
                        item.UserSubscriptionId);
                }
            }
        }

        public async Task<int> ProcessExpiredFreezesAsync(CancellationToken ct)
        {
            using var connection = new SqlConnection(_connectionString);
            var row = await connection.QueryFirstOrDefaultAsync<dynamic>(
                "sp_UserSubscriptions_ProcessExpiredFreezes",
                commandType: CommandType.StoredProcedure);
            if (row == null) return 0;
            return (int)row.RowsAffected;
        }

        private sealed class SubscriptionExpiryReminderItem
        {
            public Guid UserSubscriptionId { get; set; }
            public Guid UserId { get; set; }
            public string SubscriptionName { get; set; } = string.Empty;
            public DateTime NextBillingDate { get; set; }
            public int ReminderDays { get; set; }
        }
    }
}