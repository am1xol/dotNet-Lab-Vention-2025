using System.ComponentModel.DataAnnotations;

namespace SubscriptionManager.Core.Models;

public class RefreshToken
{
    public Guid Id { get; set; }

    [Required]
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    [Required]
    public string Token { get; set; } = string.Empty;

    public string? DeviceName { get; set; }

    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsRevoked { get; set; }
}
