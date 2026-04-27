using System.ComponentModel.DataAnnotations;
using SubscriptionManager.Core;
using SubscriptionManager.Core.DTOs;

namespace SubscriptionManager.Tests;

public class DomainValidationTests
{
    [Fact]
    public void Subscription_WithTooLongName_FailsValidation()
    {
        var model = new Subscription
        {
            Name = new string('A', 101),
            Description = "ok",
            DescriptionMarkdown = "ok",
            Price = 10m,
            Category = "Streaming"
        };

        var errors = Validate(model);

        Assert.Contains(errors, e => e.MemberNames.Contains(nameof(Subscription.Name)));
    }

    [Fact]
    public void Payment_WithInvalidCurrencyLength_FailsValidation()
    {
        var model = new Payment
        {
            Amount = 15m,
            Currency = "USDT",
            Status = PaymentStatus.Completed
        };

        var errors = Validate(model);

        Assert.Contains(errors, e => e.MemberNames.Contains(nameof(Payment.Currency)));
    }

    [Fact]
    public void Payment_WithTooLongCardLastFour_FailsValidation()
    {
        var model = new Payment
        {
            Amount = 15m,
            Currency = "USD",
            Status = PaymentStatus.Completed,
            CardLastFour = "12345"
        };

        var errors = Validate(model);

        Assert.Contains(errors, e => e.MemberNames.Contains(nameof(Payment.CardLastFour)));
    }

    [Fact]
    public void CreatePromoCodeRequest_WithInvalidDiscountType_FailsValidation()
    {
        var model = new CreatePromoCodeRequest
        {
            Code = "SPRING2026",
            Title = "Spring promo",
            DiscountType = 3,
            DiscountValue = 10m,
            ValidFrom = DateTime.UtcNow,
            ValidTo = DateTime.UtcNow.AddDays(10),
            PerUserUsageLimit = 1,
            AudienceType = 1,
            DaysBack = 30,
            TopUsersCount = 100
        };

        var errors = Validate(model);

        Assert.Contains(errors, e => e.MemberNames.Contains(nameof(CreatePromoCodeRequest.DiscountType)));
    }

    [Fact]
    public void CreatePromoCodeRequest_WithInvalidTopUsersCount_FailsValidation()
    {
        var model = new CreatePromoCodeRequest
        {
            Code = "SPRING2026",
            Title = "Spring promo",
            DiscountType = 1,
            DiscountValue = 10m,
            ValidFrom = DateTime.UtcNow,
            ValidTo = DateTime.UtcNow.AddDays(10),
            PerUserUsageLimit = 1,
            AudienceType = 1,
            DaysBack = 30,
            TopUsersCount = 0
        };

        var errors = Validate(model);

        Assert.Contains(errors, e => e.MemberNames.Contains(nameof(CreatePromoCodeRequest.TopUsersCount)));
    }

    [Fact]
    public void CreatePromoCodeRequest_WithValidData_PassesValidation()
    {
        var model = new CreatePromoCodeRequest
        {
            Code = "SPRING2026",
            Title = "Spring promo",
            Description = "valid promo",
            DiscountType = 1,
            DiscountValue = 10m,
            MaxDiscountAmount = 25m,
            ValidFrom = DateTime.UtcNow,
            ValidTo = DateTime.UtcNow.AddDays(10),
            TotalUsageLimit = 100,
            PerUserUsageLimit = 1,
            MinAmount = 0m,
            AudienceType = 1,
            DaysBack = 30,
            TopUsersCount = 100
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
