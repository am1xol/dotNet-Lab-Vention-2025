namespace SubscriptionManager.Core.Models
{
    public class Period
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public int MonthsCount { get; set; }
    }
}
