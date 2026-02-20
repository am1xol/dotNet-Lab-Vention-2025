using System.ComponentModel.DataAnnotations;

namespace SubscriptionManager.Core.Models.Requests;

public class RefreshTokenRequest
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}
