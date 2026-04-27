using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Options;

namespace SubscriptionManager.Auth.Infrastructure.Services;

public class AuthAttemptProtectionService : IAuthAttemptProtectionService
{
    private readonly IMemoryCache _cache;
    private readonly TimeProvider _timeProvider;
    private readonly AuthSecurityOptions _options;

    public AuthAttemptProtectionService(
        IMemoryCache cache,
        TimeProvider timeProvider,
        IOptions<AuthSecurityOptions> options)
    {
        _cache = cache;
        _timeProvider = timeProvider;
        _options = options.Value;
    }

    public bool IsLocked(string action, string? accountKey, string? ipAddress, out TimeSpan retryAfter)
    {
        var now = _timeProvider.GetUtcNow().UtcDateTime;
        var lockUntil = DateTime.MinValue;

        if (TryGetState(BuildKey(action, accountKey), out var accountState) && accountState.LockedUntil > lockUntil)
        {
            lockUntil = accountState.LockedUntil;
        }

        if (TryGetState(BuildKey(action, ipAddress), out var ipState) && ipState.LockedUntil > lockUntil)
        {
            lockUntil = ipState.LockedUntil;
        }

        if (lockUntil <= now)
        {
            retryAfter = TimeSpan.Zero;
            return false;
        }

        retryAfter = lockUntil - now;
        return true;
    }

    public void RegisterFailure(string action, string? accountKey, string? ipAddress, int maxFailures)
    {
        UpdateFailure(BuildKey(action, accountKey), maxFailures);
        UpdateFailure(BuildKey(action, ipAddress), maxFailures);
    }

    public void RegisterSuccess(string action, string? accountKey, string? ipAddress)
    {
        _cache.Remove(BuildKey(action, accountKey));
        _cache.Remove(BuildKey(action, ipAddress));
    }

    private void UpdateFailure(string key, int maxFailures)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            return;
        }

        var now = _timeProvider.GetUtcNow().UtcDateTime;
        var state = _cache.Get<AttemptState>(key);
        if (state is null || state.WindowEndsAt <= now)
        {
            state = new AttemptState(0, now.AddMinutes(_options.WindowMinutes), DateTime.MinValue);
        }

        var failures = state.Failures + 1;
        var lockedUntil = state.LockedUntil;
        if (failures >= maxFailures)
        {
            var multiplier = Math.Max(0, failures - maxFailures);
            var lockSeconds = _options.BaseLockoutSeconds * (int)Math.Pow(2, multiplier);
            var maxLockout = TimeSpan.FromMinutes(_options.MaxLockoutMinutes);
            var actualLockout = TimeSpan.FromSeconds(lockSeconds);
            if (actualLockout > maxLockout)
            {
                actualLockout = maxLockout;
            }

            lockedUntil = now.Add(actualLockout);
        }

        var updated = new AttemptState(failures, state.WindowEndsAt, lockedUntil);
        var absoluteExpiration = updated.WindowEndsAt > updated.LockedUntil ? updated.WindowEndsAt : updated.LockedUntil;
        _cache.Set(key, updated, absoluteExpiration);
    }

    private bool TryGetState(string key, out AttemptState state)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            state = default!;
            return false;
        }

        var found = _cache.TryGetValue(key, out AttemptState? cacheState);
        if (!found || cacheState is null)
        {
            state = default!;
            return false;
        }

        state = cacheState;
        return true;
    }

    private static string BuildKey(string action, string? segment)
    {
        if (string.IsNullOrWhiteSpace(segment))
        {
            return string.Empty;
        }

        return $"auth-protect:{action}:{segment.Trim().ToLowerInvariant()}";
    }

    private sealed record AttemptState(int Failures, DateTime WindowEndsAt, DateTime LockedUntil);
}
