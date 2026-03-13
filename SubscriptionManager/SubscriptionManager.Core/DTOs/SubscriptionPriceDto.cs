namespace SubscriptionManager.Core.DTOs
{
    public class PeriodDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int MonthsCount { get; set; }
    }

    public class SubscriptionPriceDto
    {
        public Guid Id { get; set; }
        public Guid SubscriptionId { get; set; }
        public Guid PeriodId { get; set; }
        public decimal FinalPrice { get; set; }
        public string PeriodName { get; set; } = string.Empty;
        public int MonthsCount { get; set; }
    }

    public class CreateSubscriptionPriceRequest
    {
        public Guid SubscriptionId { get; set; }
        public Guid PeriodId { get; set; }
        public decimal FinalPrice { get; set; }
    }
}