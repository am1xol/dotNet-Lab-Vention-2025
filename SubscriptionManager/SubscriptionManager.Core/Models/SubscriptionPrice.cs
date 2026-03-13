namespace SubscriptionManager.Core.Models
{
    public class SubscriptionPrice
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid SubscriptionId { get; set; }
        public Guid PeriodId { get; set; }
        public decimal FinalPrice { get; set; }

        public virtual Subscription Subscription { get; set; } = null!;
        public virtual Period Period { get; set; } = null!;
    }
}
