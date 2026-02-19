using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using SubscriptionManager.Core.Options;
using SubscriptionManager.Auth.Infrastructure.Services;
using System;
using System.Collections.Generic;
using Xunit;

namespace SubscriptionManager.Tests;

public class VerificationCodeServiceTests
{
    [Fact]
    public void GetExpirationTime_ReturnsExactTimeBasedOnProvider()
    {
        var expirationHours = 24;
        var options = Options.Create(new VerificationCodeOptions { ExpirationHours = expirationHours });

        var startTime = new DateTimeOffset(2025, 1, 1, 12, 0, 0, TimeSpan.Zero);
        var fakeTimeProvider = new FakeTimeProvider(startTime);

        var service = new VerificationCodeService(options, fakeTimeProvider);

        var expiration = service.GetExpirationTime();

        var expectedTime = startTime.UtcDateTime.AddHours(expirationHours);

        Assert.Equal(expectedTime, expiration);
    }

    [Fact]
    public void GenerateCode_ReturnsCorrectLength()
    {
        var options = Options.Create(new VerificationCodeOptions { Length = 6 });
        var service = new VerificationCodeService(options, TimeProvider.System);

        var code = service.GenerateCode();

        Assert.Equal(6, code.Length);
        Assert.True(int.TryParse(code, out _));
    }

    [Fact]
    public void GenerateCode_ReturnsUniqueCodes()
    {
        var options = Options.Create(new VerificationCodeOptions { Length = 6 });
        var service = new VerificationCodeService(options, TimeProvider.System);

        var codes = new HashSet<string>();
        for (int i = 0; i < 100; i++)
        {
            codes.Add(service.GenerateCode());
        }

        Assert.Equal(100, codes.Count);
    }

    [Theory]
    [InlineData(4)]
    [InlineData(6)]
    [InlineData(8)]
    public void GenerateCode_RespectsDifferentLengths(int length)
    {
        var options = Options.Create(new VerificationCodeOptions { Length = length });
        var service = new VerificationCodeService(options, TimeProvider.System);

        var code = service.GenerateCode();

        Assert.Equal(length, code.Length);
    }
}