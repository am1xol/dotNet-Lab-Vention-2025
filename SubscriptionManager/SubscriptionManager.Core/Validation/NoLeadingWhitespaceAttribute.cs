using System.ComponentModel.DataAnnotations;

namespace SubscriptionManager.Core.Validation;

[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter)]
public sealed class NoLeadingWhitespaceAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is null)
        {
            return ValidationResult.Success;
        }

        if (value is not string stringValue)
        {
            return new ValidationResult("Invalid value type.");
        }

        if (stringValue.Length == 0 || !char.IsWhiteSpace(stringValue[0]))
        {
            return ValidationResult.Success;
        }

        var errorMessage = ErrorMessage
            ?? $"{validationContext.DisplayName} cannot start with whitespace.";

        return new ValidationResult(errorMessage);
    }
}
