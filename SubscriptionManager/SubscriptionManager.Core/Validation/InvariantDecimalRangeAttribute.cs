using System.ComponentModel.DataAnnotations;

namespace SubscriptionManager.Core.Validation;

[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter, AllowMultiple = false)]
public sealed class InvariantDecimalRangeAttribute : ValidationAttribute
{
    private readonly decimal _minimum;
    private readonly decimal _maximum;

    public InvariantDecimalRangeAttribute(double minimum, double maximum)
    {
        _minimum = Convert.ToDecimal(minimum);
        _maximum = Convert.ToDecimal(maximum);
    }

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is null)
        {
            return ValidationResult.Success;
        }

        decimal decimalValue;
        try
        {
            decimalValue = value switch
            {
                decimal d => d,
                _ => Convert.ToDecimal(value)
            };
        }
        catch
        {
            return new ValidationResult($"The field {validationContext.MemberName} must be a decimal number.");
        }

        if (decimalValue < _minimum || decimalValue > _maximum)
        {
            var message = ErrorMessage
                ?? $"The field {validationContext.MemberName} must be between {_minimum} and {_maximum}.";
            return new ValidationResult(message);
        }

        return ValidationResult.Success;
    }
}
