namespace SubscriptionManager.Core.Interfaces
{
    public interface IProfanityFilter
    {
        bool ContainsProfanity(string text);
        string ModerateText(string text);
    }
}
