using SubscriptionManager.Core.Validation;
using System.ComponentModel.DataAnnotations;

namespace SubscriptionManager.Core.Models.Requests
{
    public class ResetPasswordRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string ResetToken { get; set; } = string.Empty;

        [Required]
        [Password]
        public string NewPassword { get; set; } = string.Empty;
    }
}
