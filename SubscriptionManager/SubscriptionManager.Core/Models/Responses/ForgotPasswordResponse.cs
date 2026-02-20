namespace SubscriptionManager.Core.Models.Responses
{
    public class ForgotPasswordResponse
    {
        public bool Success { get; set; }
        public string? Error { get; set; }
        public string? Message { get; set; }
    }
}
