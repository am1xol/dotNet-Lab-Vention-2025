namespace SubscriptionManager.Core.Interfaces;

public interface IEmailService
{
    Task SendVerificationEmailAsync(string email, string verificationCode, string firstName);
    Task SendPasswordResetEmailAsync(string email, string resetCode, string firstName);
    Task SendNotificationEmailAsync(string email, string title, string message);
}