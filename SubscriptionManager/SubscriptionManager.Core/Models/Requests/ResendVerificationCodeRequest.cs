using System.ComponentModel.DataAnnotations;

namespace SubscriptionManager.Core.Models.Requests
{
    public class ResendVerificationCodeRequest
    {
        [Required]
        [EmailAddress]
        public string? Email { get; set; }
    }
}
