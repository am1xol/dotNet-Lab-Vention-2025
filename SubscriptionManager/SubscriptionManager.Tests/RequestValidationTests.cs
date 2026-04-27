using System.ComponentModel.DataAnnotations;
using SubscriptionManager.Core.Models.Requests;

namespace SubscriptionManager.Tests;

public class RequestValidationTests
{
    [Fact]
    public void RegisterRequest_WithValidData_PassesValidation()
    {
        var model = new RegisterRequest
        {
            Email = "user@example.com",
            Password = "StrongPass123",
            AcceptTerms = true,
            FirstName = "John",
            LastName = "Doe"
        };

        var errors = Validate(model);

        Assert.Empty(errors);
    }

    [Fact]
    public void RegisterRequest_WithoutAcceptTerms_FailsValidation()
    {
        var model = new RegisterRequest
        {
            Email = "user@example.com",
            Password = "StrongPass123",
            AcceptTerms = false,
            FirstName = "John",
            LastName = "Doe"
        };

        var errors = Validate(model);

        Assert.Contains(errors, e => e.MemberNames.Contains(nameof(RegisterRequest.AcceptTerms)));
    }

    [Fact]
    public void RegisterRequest_WithLeadingSpaceInFirstName_FailsValidation()
    {
        var model = new RegisterRequest
        {
            Email = "user@example.com",
            Password = "StrongPass123",
            AcceptTerms = true,
            FirstName = " John",
            LastName = "Doe"
        };

        var errors = Validate(model);

        Assert.Contains(errors, e =>
            (e.ErrorMessage ?? string.Empty).Contains("First name cannot start or end with spaces", StringComparison.Ordinal));
    }

    [Fact]
    public void RegisterRequest_WithWeakPassword_FailsValidation()
    {
        var model = new RegisterRequest
        {
            Email = "user@example.com",
            Password = "weakpass",
            AcceptTerms = true,
            FirstName = "John",
            LastName = "Doe"
        };

        var errors = Validate(model);

        Assert.Contains(errors, e => e.MemberNames.Contains(nameof(RegisterRequest.Password)));
    }

    [Fact]
    public void LoginRequest_WithInvalidEmail_FailsValidation()
    {
        var model = new LoginRequest
        {
            Email = "invalid-email",
            Password = "any-password"
        };

        var errors = Validate(model);

        Assert.Contains(errors, e => e.MemberNames.Contains(nameof(LoginRequest.Email)));
    }

    [Fact]
    public void ForgotPasswordRequest_WithoutEmail_FailsValidation()
    {
        var model = new ForgotPasswordRequest
        {
            Email = string.Empty
        };

        var errors = Validate(model);

        Assert.Contains(errors, e => e.MemberNames.Contains(nameof(ForgotPasswordRequest.Email)));
    }

    [Fact]
    public void RefreshTokenRequest_WithoutRefreshToken_FailsValidation()
    {
        var model = new RefreshTokenRequest
        {
            RefreshToken = string.Empty
        };

        var errors = Validate(model);

        Assert.Contains(errors, e => e.MemberNames.Contains(nameof(RefreshTokenRequest.RefreshToken)));
    }

    [Fact]
    public void ResendVerificationCodeRequest_WithInvalidEmail_FailsValidation()
    {
        var model = new ResendVerificationCodeRequest
        {
            Email = "not-an-email"
        };

        var errors = Validate(model);

        Assert.Contains(errors, e => e.MemberNames.Contains(nameof(ResendVerificationCodeRequest.Email)));
    }

    [Fact]
    public void VerifyEmailRequest_WithoutVerificationCode_FailsValidation()
    {
        var model = new VerifyEmailRequest
        {
            Email = "user@example.com",
            VerificationCode = string.Empty
        };

        var errors = Validate(model);

        Assert.Contains(errors, e => e.MemberNames.Contains(nameof(VerifyEmailRequest.VerificationCode)));
    }

    [Fact]
    public void ResetPasswordRequest_WithWeakPassword_FailsValidation()
    {
        var model = new ResetPasswordRequest
        {
            Email = "user@example.com",
            ResetToken = "token",
            NewPassword = "weakpass"
        };

        var errors = Validate(model);

        Assert.Contains(errors, e => e.MemberNames.Contains(nameof(ResetPasswordRequest.NewPassword)));
    }

    [Fact]
    public void ChangePasswordRequest_WithWeakNewPassword_FailsValidation()
    {
        var model = new ChangePasswordRequest
        {
            CurrentPassword = "CurrentPass123",
            NewPassword = "weakpass"
        };

        var errors = Validate(model);

        Assert.Contains(errors, e => e.MemberNames.Contains(nameof(ChangePasswordRequest.NewPassword)));
    }

    [Fact]
    public void UpdateProfileRequest_WithReminderDaysOutOfRange_FailsValidation()
    {
        var model = new UpdateProfileRequest
        {
            FirstName = "John",
            LastName = "Doe",
            SubscriptionExpiryReminderDays = 15
        };

        var errors = Validate(model);

        Assert.Contains(errors, e => e.MemberNames.Contains(nameof(UpdateProfileRequest.SubscriptionExpiryReminderDays)));
    }

    [Fact]
    public void UpdateProfileRequest_WithValidData_PassesValidation()
    {
        var model = new UpdateProfileRequest
        {
            FirstName = "John",
            LastName = "Doe",
            SubscriptionExpiryReminderDays = 14
        };

        var errors = Validate(model);

        Assert.Empty(errors);
    }

    private static List<ValidationResult> Validate<T>(T model)
    {
        var context = new ValidationContext(model!);
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(model!, context, results, validateAllProperties: true);
        return results;
    }
}
