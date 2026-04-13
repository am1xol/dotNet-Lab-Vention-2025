namespace SubscriptionManager.Core.Options
{
    public class ChatModerationOptions
    {
        public const string SectionName = "ChatModeration";

        public List<string> ForbiddenWords { get; set; } = new();
    }
}
