using System.ComponentModel.DataAnnotations;

namespace SubscriptionManager.Core.Models.Requests
{
    public class ForgotPasswordRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }
}
