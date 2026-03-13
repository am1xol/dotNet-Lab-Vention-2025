namespace SubscriptionManager.Core.DTOs
{
    public class CreateSubscriptionWithPriceRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string DescriptionMarkdown { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Category { get; set; } = string.Empty;
        public Guid? IconFileId { get; set; }
        public Guid PeriodId { get; set; }
        public decimal FinalPrice { get; set; }
    }
}