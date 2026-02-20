using SubscriptionManager.Core.Validation;
using System.ComponentModel.DataAnnotations;

namespace SubscriptionManager.Core.Models.Requests;

public class RegisterRequest
{
    [Required]
    [EmailAddress]
    [MaxLength(254)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [Password]
    public string Password { get; set; } = string.Empty;

    [Required]
    [MinLength(1)]
    [MaxLength(25)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MinLength(1)]
    [MaxLength(25)]
    public string LastName { get; set; } = string.Empty;

    public string Role { get; set; } = "User";
}
