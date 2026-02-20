using Microsoft.Extensions.Options;
using SubscriptionManager.Auth.Infrastructure.Services;
using SubscriptionManager.Core.Options;

namespace SubscriptionManager.Tests;

public class PasswordHasherTests
{
    private readonly CustomPasswordHasher _passwordHasher;

    public PasswordHasherTests()
    {
        var options = Options.Create(new PasswordHasherOptions());
        _passwordHasher = new CustomPasswordHasher(options);
    }

    [Fact]
    public void HashPassword_ShouldReturnDifferentHashes_ForSamePassword()
    {
        var password = "TestPassword123!";
        var hash1 = _passwordHasher.HashPassword(password);
        var hash2 = _passwordHasher.HashPassword(password);
        Assert.NotEqual(hash1, hash2);
    }

    [Fact]
    public void VerifyPassword_ShouldReturnTrue_ForCorrectPassword()
    {
        var password = "TestPassword123!";
        var hash = _passwordHasher.HashPassword(password);
        var result = _passwordHasher.VerifyPassword(password, hash);
        Assert.True(result);
    }
}
