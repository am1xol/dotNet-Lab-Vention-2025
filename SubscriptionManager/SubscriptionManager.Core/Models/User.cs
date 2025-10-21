using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;

namespace SubscriptionManager.Core.Models;

public class User
{
    public Guid Id { get; set; }

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [MinLength(1)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MinLength(1)]
    public string LastName { get; set; } = string.Empty;

    public bool IsEmailVerified { get; set; }
    public string? EmailVerificationCode { get; set; }
    public DateTime? EmailVerificationCodeExpiresAt { get; set; }

    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
