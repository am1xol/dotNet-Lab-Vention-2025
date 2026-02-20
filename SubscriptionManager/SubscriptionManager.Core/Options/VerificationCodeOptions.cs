namespace SubscriptionManager.Core.Options
{
    public class VerificationCodeOptions
    {
        public const string SectionName = "VerificationCode";

        public int Length { get; set; } = 6;
        public int ExpirationHours { get; set; } = 24;
    }
}
