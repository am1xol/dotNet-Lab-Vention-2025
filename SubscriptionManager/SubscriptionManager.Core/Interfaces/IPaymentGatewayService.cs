using SubscriptionManager.Core.DTOs;

namespace SubscriptionManager.Core.Interfaces
{
    public interface IPaymentGatewayService
    {
        Task<PaymentInitiationResult> InitiatePaymentAsync(decimal amount, string currency, string description, string trackingId, string email, DateTime? expiredAt = null);
        Task<PaymentStatus?> CheckPaymentStatusAsync(string trackingId);
    }
}
