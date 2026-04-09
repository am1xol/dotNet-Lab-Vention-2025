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
    [Range(typeof(bool), "true", "true", ErrorMessage = "You must accept the user agreement")]
    public bool AcceptTerms { get; set; }

    [Required]
    [MinLength(1)]
    [MaxLength(25)]
    [NoLeadingOrTrailingWhitespace(ErrorMessage = "First name cannot start or end with spaces")]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MinLength(1)]
    [MaxLength(25)]
    [NoLeadingOrTrailingWhitespace(ErrorMessage = "Last name cannot start or end with spaces")]
    public string LastName { get; set; } = string.Empty;

    public string Role { get; set; } = "User";
}
