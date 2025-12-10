using SubscriptionManager.Core.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SubscriptionManager.Core
{
    public class Payment
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserSubscriptionId { get; set; }
        public Guid UserId { get; set; }

        [Required]
        public decimal Amount { get; set; }

        [Required]
        [StringLength(3)]
        public string Currency { get; set; } = "BYN";

        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }

        [Required]
        public PaymentStatus Status { get; set; } = PaymentStatus.Completed;

        [StringLength(4)]
        public string CardLastFour { get; set; } = string.Empty;

        [StringLength(20)]
        public string CardBrand { get; set; } = string.Empty;

        public virtual UserSubscription UserSubscription { get; set; } = null!;

        [StringLength(100)]
        public string? ExternalTransactionId { get; set; }
    }

    public enum PaymentStatus
    {
        Pending,
        Completed,
        Failed
    }
}
