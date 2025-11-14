using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace SubscriptionManager.Core.Models;

public class User
{
    public Guid Id { get; set; }

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(88)]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [MinLength(1)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MinLength(1)]
    public string LastName { get; set; } = string.Empty;

    public bool IsEmailVerified { get; set; }
    [JsonIgnore]
    public string? EmailVerificationCode { get; set; }
    [JsonIgnore]
    public DateTime? EmailVerificationCodeExpiresAt { get; set; }

    [JsonIgnore]
    public string? RefreshToken { get; set; }
    [JsonIgnore]
    public DateTime? RefreshTokenExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    [Required]
    [StringLength(5)]
    public string Role { get; set; } = "User";
}
