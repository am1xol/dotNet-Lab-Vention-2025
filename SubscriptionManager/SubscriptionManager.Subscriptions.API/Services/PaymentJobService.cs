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
    }

    public class PaymentJobService : IPaymentJobService
    {
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
    }
}