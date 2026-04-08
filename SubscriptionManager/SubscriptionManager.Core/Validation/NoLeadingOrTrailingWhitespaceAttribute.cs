using System.ComponentModel.DataAnnotations;

namespace SubscriptionManager.Core.Validation;

[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter)]
public sealed class NoLeadingOrTrailingWhitespaceAttribute : ValidationAttribute
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

        var isValid = stringValue.Trim() == stringValue;
        if (isValid)
        {
            return ValidationResult.Success;
        }

        var errorMessage = ErrorMessage
            ?? $"{validationContext.DisplayName} cannot start or end with spaces.";

        return new ValidationResult(errorMessage);
    }
}
