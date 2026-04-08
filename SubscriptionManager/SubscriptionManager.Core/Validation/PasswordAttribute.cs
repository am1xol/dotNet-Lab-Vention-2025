using System.ComponentModel.DataAnnotations;

namespace SubscriptionManager.Core.Validation;

public class PasswordAttribute : ValidationAttribute
{
    public PasswordAttribute()
    {
        ErrorMessage = "Пароль должен содержать не менее 8 символов и содержать как минимум одну заглавную букву, одну строчную букву и одну цифру";
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
