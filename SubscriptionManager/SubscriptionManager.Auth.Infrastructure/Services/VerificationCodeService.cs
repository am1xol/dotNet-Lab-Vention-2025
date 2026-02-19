using Microsoft.Extensions.Options;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SubscriptionManager.Auth.Infrastructure.Services;

public class VerificationCodeService : IVerificationCodeService
{
    private readonly VerificationCodeOptions _options;
    private readonly TimeProvider _timeProvider;
    private static readonly Random _globalRandom = new();
    private static readonly ThreadLocal<Random> _localRandom = new(() =>
    {
        lock (_globalRandom)
        {
            return new Random(_globalRandom.Next());
        }
    });

    public VerificationCodeService(IOptions<VerificationCodeOptions> options, TimeProvider timeProvider)
    {
        _options = options.Value;
        _timeProvider = timeProvider;
    }

    public string GenerateCode()
    {
        var random = _localRandom.Value!;
        var maxValue = (int)Math.Pow(10, _options.Length);
        var code = random.Next(0, maxValue).ToString($"D{_options.Length}");
        return code;
    }

    public DateTime GetExpirationTime()
    {
        return _timeProvider.GetUtcNow().UtcDateTime.AddHours(_options.ExpirationHours);
    }
}