using SubscriptionManager.Core.Validation;
using System.ComponentModel.DataAnnotations;

namespace SubscriptionManager.Core.Models.Requests
{
    public class ChangePasswordRequest
    {
        [Required]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required]
        [Password]
        public string NewPassword { get; set; } = string.Empty;
    }
}
