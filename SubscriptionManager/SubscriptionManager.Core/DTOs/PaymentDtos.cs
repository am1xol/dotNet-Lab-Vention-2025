using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SubscriptionManager.Core.DTOs
{
    public class PaymentInfoDto
    {
        public string CardNumber { get; set; } = string.Empty;
        public string ExpiryMonth { get; set; } = string.Empty;
        public string ExpiryYear { get; set; } = string.Empty;
        public string Cvc { get; set; } = string.Empty;
        public string CardholderName { get; set; } = string.Empty;
    }

    public class SubscribeWithPaymentRequest
    {
        public Guid SubscriptionId { get; set; }
        public PaymentInfoDto PaymentInfo { get; set; } = null!;
    }

    public class PaymentDto
    {
        public Guid Id { get; set; }
        public Guid UserSubscriptionId { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = string.Empty;
        public DateTime PaymentDate { get; set; }
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
        public string Status { get; set; } = string.Empty;
        public string CardLastFour { get; set; } = string.Empty;
        public string CardBrand { get; set; } = string.Empty;
        public SubscriptionDto Subscription { get; set; } = null!;
    }

    public class UserStatisticsDto
    {
        public decimal TotalSpent { get; set; }
        public int ActiveSubscriptionsCount { get; set; }
        public int TotalSubscriptionsCount { get; set; }
        public DateTime? NextBillingDate { get; set; }
        public List<PaymentDto> RecentPayments { get; set; } = new();
        public List<UpcomingPaymentDto> UpcomingPayments { get; set; } = new();
    }

    public class UpcomingPaymentDto
    {
        public Guid SubscriptionId { get; set; }
        public string SubscriptionName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public DateTime NextBillingDate { get; set; }
    }
}
