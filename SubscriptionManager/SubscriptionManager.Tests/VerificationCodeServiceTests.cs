using Microsoft.Extensions.Options;
using SubscriptionManager.Core.Options;
using SubscriptionManager.Infrastructure.Services;
using Xunit;

namespace SubscriptionManager.Tests;

public class VerificationCodeServiceTests
{
    [Fact]
    public void GenerateCode_ReturnsCorrectLength()
    {
        var options = Options.Create(new VerificationCodeOptions { Length = 6 });
        var service = new VerificationCodeService(options);

        var code = service.GenerateCode();

        Assert.Equal(6, code.Length);
        Assert.True(int.TryParse(code, out _));
    }

    [Fact]
    public void GenerateCode_ReturnsUniqueCodes()
    {
        var options = Options.Create(new VerificationCodeOptions { Length = 6 });
        var service = new VerificationCodeService(options);

        var codes = new HashSet<string>();
        for (int i = 0; i < 100; i++)
        {
            codes.Add(service.GenerateCode());
        }

        Assert.Equal(100, codes.Count);
    }

    [Fact]
    public void GetExpirationTime_ReturnsFutureTime()
    {
        var options = Options.Create(new VerificationCodeOptions { ExpirationHours = 24 });
        var service = new VerificationCodeService(options);
        var now = DateTime.UtcNow;

        var expiration = service.GetExpirationTime();

        Assert.True(expiration > now);
        Assert.True(expiration <= now.AddHours(24).AddMinutes(1));
    }

    [Theory]
    [InlineData(4)]
    [InlineData(6)]
    [InlineData(8)]
    public void GenerateCode_RespectsDifferentLengths(int length)
    {
        var options = Options.Create(new VerificationCodeOptions { Length = length });
        var service = new VerificationCodeService(options);

        var code = service.GenerateCode();

        Assert.Equal(length, code.Length);
    }
}
