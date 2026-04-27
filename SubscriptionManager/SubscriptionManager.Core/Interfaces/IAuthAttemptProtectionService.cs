namespace SubscriptionManager.Core.Interfaces;

public interface IAuthAttemptProtectionService
{
    bool IsLocked(string action, string? accountKey, string? ipAddress, out TimeSpan retryAfter);
    void RegisterFailure(string action, string? accountKey, string? ipAddress, int maxFailures);
    void RegisterSuccess(string action, string? accountKey, string? ipAddress);
}
