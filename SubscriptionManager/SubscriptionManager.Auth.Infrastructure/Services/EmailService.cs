using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Options;
using System.Net;
using System.Net.Mail;

namespace SubscriptionManager.Auth.Infrastructure.Services;

public class EmailService : IEmailService
{
    private record SmtpEndpointSettings(
        string SmtpServer,
        int SmtpPort,
        bool EnableSsl,
        bool UseAuthentication,
        string UserName,
        string Password,
        string SenderEmail,
        string SenderName,
        int TimeoutMs);

    private readonly EmailSettings _emailSettings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<EmailSettings> emailSettings, ILogger<EmailService> logger)
    {
        _emailSettings = emailSettings.Value;
        _logger = logger;
    }

    private async Task SendWithRetryAsync(Func<MailMessage> createMessage, SmtpEndpointSettings endpointSettings, string recipientEmail, int maxRetries = 3)
    {
        TimeSpan delay = TimeSpan.FromSeconds(2);

        for (int i = 0; i <= maxRetries; i++)
        {
            try
            {
                using var client = new SmtpClient(endpointSettings.SmtpServer, endpointSettings.SmtpPort);
                client.EnableSsl = endpointSettings.EnableSsl;
                client.Timeout = endpointSettings.TimeoutMs;
                using var mailMessage = createMessage();

                if (endpointSettings.UseAuthentication)
                {
                    client.Credentials = new NetworkCredential(endpointSettings.UserName, endpointSettings.Password);
                }
                else
                {
                    client.Credentials = null;
                }

                await client.SendMailAsync(mailMessage);

                if (i > 0)
                {
                    _logger.LogInformation("Successfully sent email after {Retries} retries.", i);
                }
                return;
            }
            catch (Exception ex)
            {
                if (i == maxRetries)
                {
                    _logger.LogError(ex, "Failed to send email to {Recipient} after {MaxRetries} retries.", recipientEmail, maxRetries);
                    throw;
                }

                _logger.LogWarning(ex, "Failed to send email to {Recipient}. Attempt {Attempt} of {MaxRetries}. Retrying in {Delay}s...",
                    recipientEmail, i + 1, maxRetries, delay.TotalSeconds);

                await Task.Delay(delay);
                delay *= 2;
            }
        }
    }

    private SmtpEndpointSettings GetPrimaryEndpoint() =>
        new(
            _emailSettings.SmtpServer,
            _emailSettings.SmtpPort,
            _emailSettings.EnableSsl,
            _emailSettings.UseAuthentication,
            _emailSettings.UserName,
            _emailSettings.Password,
            _emailSettings.SenderEmail,
            _emailSettings.SenderName,
            _emailSettings.TimeoutMs);

    private SmtpEndpointSettings? GetSecondaryEndpoint()
    {
        if (!_emailSettings.EnableSecondaryDelivery || string.IsNullOrWhiteSpace(_emailSettings.SecondarySmtpServer))
        {
            return null;
        }

        return new SmtpEndpointSettings(
            _emailSettings.SecondarySmtpServer,
            _emailSettings.SecondarySmtpPort,
            _emailSettings.SecondaryEnableSsl,
            _emailSettings.SecondaryUseAuthentication,
            _emailSettings.SecondaryUserName,
            _emailSettings.SecondaryPassword,
            string.IsNullOrWhiteSpace(_emailSettings.SecondarySenderEmail) ? _emailSettings.SenderEmail : _emailSettings.SecondarySenderEmail,
            string.IsNullOrWhiteSpace(_emailSettings.SecondarySenderName) ? _emailSettings.SenderName : _emailSettings.SecondarySenderName,
            _emailSettings.SecondaryTimeoutMs);
    }

    private async Task SendToConfiguredEndpointsAsync(string recipientEmail, Func<SmtpEndpointSettings, MailMessage> createMessage)
    {
        var primary = GetPrimaryEndpoint();
        await SendWithRetryAsync(() => createMessage(primary), primary, recipientEmail);

        var secondary = GetSecondaryEndpoint();
        if (secondary is null)
        {
            return;
        }

        _ = Task.Run(async () =>
        {
            try
            {
                _logger.LogInformation("Starting secondary SMTP delivery to {Recipient} via {Server}:{Port}.", recipientEmail, secondary.SmtpServer, secondary.SmtpPort);
                await SendWithRetryAsync(() => createMessage(secondary), secondary, recipientEmail, maxRetries: 0);
                _logger.LogInformation("Secondary SMTP delivery succeeded for {Recipient}.", recipientEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Primary SMTP delivery succeeded, but secondary SMTP delivery failed.");
            }
        });
    }

    public async Task SendVerificationEmailAsync(string email, string verificationCode, string firstName)
    {
        await SendToConfiguredEndpointsAsync(email, endpoint =>
        {
            var mailMessage = new MailMessage
            {
                From = new MailAddress(endpoint.SenderEmail, endpoint.SenderName),
                Subject = "Verify your email address",
                Body = $"""
                Hello {firstName},

                Please use the following code to verify your email address:

                Verification Code: {verificationCode}

                This code will expire in 24 hours.

                If you didn't create an account, please ignore this email.

                Best regards,
                {endpoint.SenderName}
                """,
                IsBodyHtml = false
            };

            mailMessage.To.Add(email);
            return mailMessage;
        });
    }

    public async Task SendPasswordResetEmailAsync(string email, string resetCode, string firstName)
    {
        await SendToConfiguredEndpointsAsync(email, endpoint =>
        {
            var mailMessage = new MailMessage
            {
                From = new MailAddress(endpoint.SenderEmail, endpoint.SenderName),
                Subject = "Password Reset Code - SubscriptionManager",
                Body = $"""
            Hello {firstName}!

            You requested to reset your password. Use the following code to reset your password:

            Reset Code: {resetCode}

            This code will expire in 1 hour.

            If you didn't request this, please ignore this email.

            Best regards,
            SubscriptionManager Team
            """,
                IsBodyHtml = false
            };

            mailMessage.To.Add(email);
            return mailMessage;
        });
    }

    public async Task SendNotificationEmailAsync(string email, string title, string message)
    {
        await SendToConfiguredEndpointsAsync(email, endpoint =>
        {
            var mailMessage = new MailMessage
            {
                From = new MailAddress(endpoint.SenderEmail, endpoint.SenderName),
                Subject = title,
                Body = $"""
                    Hello!
                    
                    You have a new notification in Subscription Manager:
                    
                    {message}
                    
                    Best regards,
                    {endpoint.SenderName}
                    """,
                IsBodyHtml = false
            };
            mailMessage.To.Add(email);
            return mailMessage;
        });
    }
}