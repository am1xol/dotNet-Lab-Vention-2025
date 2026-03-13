using Dapper;
using Microsoft.Data.SqlClient;
using SubscriptionManager.Core;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Models;
using SubscriptionManager.Subscriptions.Infrastructure.Services;

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
            await connection.OpenAsync(ct);

            const string getStuckSql = "sp_Jobs_GetStuckPayments";
            var stuckPayments = await connection.QueryAsync<Payment, UserSubscription, Payment>(
                getStuckSql,
                (payment, userSub) =>
                {
                    payment.UserSubscription = userSub;
                    return payment;
                },
                splitOn: "UserSubscriptionId",
                commandType: System.Data.CommandType.StoredProcedure);

            var stuckList = stuckPayments.ToList();
            if (!stuckList.Any())
            {
                _logger.LogInformation("No stuck payments found.");
                return 0;
            }

            _logger.LogInformation("Found {Count} stuck payments. Verifying with bePaid...", stuckList.Count);
            int updatedCount = 0;

            foreach (var payment in stuckList)
            {
                try
                {
                    var remoteStatus = await _gatewayService.CheckPaymentStatusAsync(payment.Id.ToString());

                    if (remoteStatus.HasValue)
                    {
                        if (remoteStatus.Value != PaymentStatus.Pending)
                        {
                            const string updatePaymentSql = "sp_Payments_UpdateStatus";
                            await connection.ExecuteAsync(updatePaymentSql, new
                            {
                                payment.Id,
                                Status = remoteStatus.Value,
                                ExternalTransactionId = (string?)null,
                                CardLastFour = (string?)null,
                                CardBrand = (string?)null
                            }, commandType: System.Data.CommandType.StoredProcedure);

                            string subscriptionName = "Unknown";
                            if (payment.UserSubscription != null)
                            {
                                const string getNameSql = @"
                            SELECT s.Name 
                            FROM UserSubscriptions us
                            INNER JOIN SubscriptionPrices sp ON us.SubscriptionPriceId = sp.Id
                            INNER JOIN Subscriptions s ON sp.SubscriptionId = s.Id
                            WHERE us.Id = @UserSubscriptionId";
                                subscriptionName = await connection.QueryFirstOrDefaultAsync<string>(
                                    getNameSql,
                                    new { payment.UserSubscriptionId }) ?? "Unknown";
                            }

                            if (remoteStatus.Value == PaymentStatus.Completed && payment.UserSubscription != null)
                            {
                                const string activateSubSql = "UPDATE UserSubscriptions SET IsActive = 1 WHERE Id = @UserSubscriptionId";
                                await connection.ExecuteAsync(activateSubSql, new { payment.UserSubscriptionId });
                            }
                            else if (remoteStatus.Value == PaymentStatus.Failed)
                            {
                                await _notificationService.CreateAsync(
                                    payment.UserId,
                                    "Ошибка оплаты",
                                    $"Не удалось продлить подписку '{subscriptionName}'. Платеж отклонен платежной системой.",
                                    NotificationType.Error
                                );
                            }

                            updatedCount++;
                        }
                    }
                    else
                    {
                        const string updatePaymentSql = "sp_Payments_UpdateStatus";
                        await connection.ExecuteAsync(updatePaymentSql, new
                        {
                            payment.Id,
                            Status = PaymentStatus.Failed,
                            ExternalTransactionId = (string?)null,
                            CardLastFour = (string?)null,
                            CardBrand = (string?)null
                        }, commandType: System.Data.CommandType.StoredProcedure);

                        string subscriptionName = "Unknown";
                        if (payment.UserSubscription != null)
                        {
                            const string getNameSql = @"
                        SELECT s.Name 
                        FROM UserSubscriptions us
                        INNER JOIN SubscriptionPrices sp ON us.SubscriptionPriceId = sp.Id
                        INNER JOIN Subscriptions s ON sp.SubscriptionId = s.Id
                        WHERE us.Id = @UserSubscriptionId";
                            subscriptionName = await connection.QueryFirstOrDefaultAsync<string>(
                                getNameSql,
                                new { payment.UserSubscriptionId }) ?? "Unknown";
                        }

                        await _notificationService.CreateAsync(
                            payment.UserId,
                            "Время ожидания истекло",
                            $"Платеж для подписки '{subscriptionName}' был отменен из-за истечения времени ожидания.",
                            NotificationType.Error
                        );

                        updatedCount++;
                        _logger.LogInformation("Payment {Id} has no transactions in bePaid and exceeded timeout. Marking as Failed.", payment.Id);
                    }
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
            await connection.OpenAsync(ct);

            const string expireSql = "sp_Jobs_ProcessExpiredSubscriptions";
            var expired = await connection.QueryAsync(expireSql, commandType: System.Data.CommandType.StoredProcedure);

            foreach (var item in expired)
            {
                Guid userId = item.UserId;

                Guid? subscriptionPriceId = item.SubscriptionPriceId;

                if (subscriptionPriceId == null)
                {
                    _logger.LogWarning("SubscriptionPriceId is null for expired subscription. UserId: {UserId}", userId);
                    continue;
                }

                const string getNameSql = @"
            SELECT s.Name 
            FROM SubscriptionPrices sp
            INNER JOIN Subscriptions s ON sp.SubscriptionId = s.Id
            WHERE sp.Id = @SubscriptionPriceId";

                var subscriptionName = await connection.QueryFirstOrDefaultAsync<string>(
                    getNameSql,
                    new { SubscriptionPriceId = subscriptionPriceId.Value });

                if (!string.IsNullOrEmpty(subscriptionName))
                {
                    await _notificationService.CreateAsync(
                        userId,
                        "Подписка истекла",
                        $"Срок действия вашей подписки '{subscriptionName}' истек. Пожалуйста, продлите её, чтобы продолжить пользоваться сервисом.",
                        NotificationType.Warning
                    );
                }

                _logger.LogInformation("SubscriptionPrice {SubscriptionPriceId} marked as expired for User {UserId}",
                    subscriptionPriceId.Value, userId);
            }
        }
    }
}