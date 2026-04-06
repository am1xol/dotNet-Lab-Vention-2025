namespace SubscriptionManager.Core.DTOs
{
    public class PromoCodeDto
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int DiscountType { get; set; }
        public decimal DiscountValue { get; set; }
        public decimal? MaxDiscountAmount { get; set; }
        public DateTime ValidFrom { get; set; }
        public DateTime ValidTo { get; set; }
        public int? TotalUsageLimit { get; set; }
        public int PerUserUsageLimit { get; set; }
        public Guid? SubscriptionId { get; set; }
        public Guid? PeriodId { get; set; }
        public decimal? MinAmount { get; set; }
        public int UserUsageCount { get; set; }
    }

    public class CreatePromoCodeRequest
    {
        public string Code { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int DiscountType { get; set; }
        public decimal DiscountValue { get; set; }
        public decimal? MaxDiscountAmount { get; set; }
        public DateTime ValidFrom { get; set; }
        public DateTime ValidTo { get; set; }
        public int? TotalUsageLimit { get; set; }
        public int PerUserUsageLimit { get; set; } = 1;
        public Guid? SubscriptionId { get; set; }
        public Guid? PeriodId { get; set; }
        public decimal? MinAmount { get; set; }
        public int AudienceType { get; set; } = 1;
        public int DaysBack { get; set; } = 30;
        public int TopUsersCount { get; set; } = 100;
    }

    public class AssignPromoCodeRequest
    {
        public Guid PromoCodeId { get; set; }
        public List<Guid> UserIds { get; set; } = new();
    }

    public class ValidatePromoCodeRequest
    {
        public Guid SubscriptionPriceId { get; set; }
        public string PromoCode { get; set; } = string.Empty;
    }

    public class PromoCodeValidationResultDto
    {
        public Guid PromoCodeId { get; set; }
        public string PromoCode { get; set; } = string.Empty;
        public decimal BaseAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal FinalAmount { get; set; }
    }

    public class PromoCodeAudienceUserDto
    {
        public Guid UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public int PaymentsCount { get; set; }
        public decimal TotalSpent { get; set; }
        public DateTime? LastPaymentDate { get; set; }
    }

    public class PromoCodeDeliveryReportItemDto
    {
        public Guid UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public DateTime AssignedAt { get; set; }
        public bool IsActive { get; set; }
        public int UserUsageCount { get; set; }
    }

    public class PromoCodeDeliverySummaryDto
    {
        public Guid PromoCodeId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public int AssignedUsersCount { get; set; }
        public int UsedUsersCount { get; set; }
        public int TotalUsagesCount { get; set; }
        public List<PromoCodeDeliveryReportItemDto> Accounts { get; set; } = new();
    }

    public class PromoCodeCreateResultDto
    {
        public PromoCodeDto PromoCode { get; set; } = new();
        public int AssignedUsersCount { get; set; }
        public List<PromoCodeAudienceUserDto> AssignedAccounts { get; set; } = new();
    }
}
