using SubscriptionManager.Core.Validation;

namespace SubscriptionManager.Tests;

public class PasswordAttributeTests
{
    private readonly PasswordAttribute _passwordAttribute;

    public PasswordAttributeTests()
    {
        _passwordAttribute = new PasswordAttribute();
    }

    [Theory]
    [InlineData("Short1!")]    // 7 chars
    [InlineData("A")]          // 1 char  
    [InlineData("1234567")]    // 7 chars, no letters
    public void IsValid_ShouldReturnFalse_WhenPasswordTooShort(string password)
    {
        var result = _passwordAttribute.IsValid(password);
        Assert.False(result);
    }

    [Theory]
    [InlineData("nouppercase1")]    // no uppercase
    [InlineData("12345678abc")]     // no uppercase
    public void IsValid_ShouldReturnFalse_WhenNoUppercase(string password)
    {
        var result = _passwordAttribute.IsValid(password);
        Assert.False(result);
    }

    [Theory]
    [InlineData("NOLOWERCASE1")]    // no lowercase  
    [InlineData("12345678ABC")]     // no lowercase
    public void IsValid_ShouldReturnFalse_WhenNoLowercase(string password)
    {
        var result = _passwordAttribute.IsValid(password);
        Assert.False(result);
    }

    [Theory]
    [InlineData("NoDigitsHere")]        // no digits
    [InlineData("Abcdefgh")]            // no digits
    public void IsValid_ShouldReturnFalse_WhenNoDigits(string password)
    {
        var result = _passwordAttribute.IsValid(password);
        Assert.False(result);
    }

    [Theory]
    [InlineData("ValidPass123")]
    [InlineData("AnotherValid1")]
    [InlineData("StrongPass123")]
    [InlineData("Test1234")]
    public void IsValid_ShouldReturnTrue_WhenPasswordMeetsAllRequirements(string password)
    {
        var result = _passwordAttribute.IsValid(password);
        Assert.True(result);
    }

    [Fact]
    public void IsValid_ShouldReturnFalse_WhenPasswordIsNull()
    {
        var result = _passwordAttribute.IsValid(null);
        Assert.False(result);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void IsValid_ShouldReturnFalse_WhenPasswordIsEmptyOrWhitespace(string password)
    {
        var result = _passwordAttribute.IsValid(password);
        Assert.False(result);
    }

    [Fact]
    public void IsValid_ShouldReturnFalse_WhenPasswordIsNotString()
    {
        var result = _passwordAttribute.IsValid(12345);
        Assert.False(result);
    }
}
