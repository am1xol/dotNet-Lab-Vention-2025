using System.ComponentModel.DataAnnotations;

namespace SubscriptionManager.Core.Validation;

public class PasswordAttribute : ValidationAttribute
{
    public PasswordAttribute()
    {
        ErrorMessage = "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one digit";
    }

    public override bool IsValid(object? value)
    {
        if (value is not string password) return false;

        if (password.Length < 8) return false;

        if (!password.Any(char.IsUpper)) return false;

        if (!password.Any(char.IsLower)) return false;

        if (!password.Any(char.IsDigit)) return false;

        return true;
    }
}
