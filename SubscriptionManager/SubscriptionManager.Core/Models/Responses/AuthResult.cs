namespace SubscriptionManager.Core.Models.Responses;

public class AuthResult
{
    public bool Success { get; set; }
    public string? UserId { get; set; }
    public string? Error { get; set; }
}
