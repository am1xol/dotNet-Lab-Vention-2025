using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Options;
using System.Net;
using System.Net.Mail;

namespace SubscriptionManager.Auth.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly EmailSettings _emailSettings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<EmailSettings> emailSettings, ILogger<EmailService> logger)
    {
        _emailSettings = emailSettings.Value;
        _logger = logger;
    }

    private async Task SendWithRetryAsync(MailMessage mailMessage)
    {
        int maxRetries = 3;
        TimeSpan delay = TimeSpan.FromSeconds(2);

        for (int i = 0; i <= maxRetries; i++)
        {
            try
            {
                using var client = new SmtpClient(_emailSettings.SmtpServer, _emailSettings.SmtpPort);
                client.EnableSsl = _emailSettings.EnableSsl;

                if (_emailSettings.UseAuthentication)
                {
                    client.Credentials = new NetworkCredential(_emailSettings.UserName, _emailSettings.Password);
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
                    _logger.LogError(ex, "Failed to send email to {Recipient} after {MaxRetries} retries.", mailMessage.To.FirstOrDefault()?.Address, maxRetries);
                    throw;
                }

                _logger.LogWarning(ex, "Failed to send email to {Recipient}. Attempt {Attempt} of {MaxRetries}. Retrying in {Delay}s...",
                    mailMessage.To.FirstOrDefault()?.Address, i + 1, maxRetries, delay.TotalSeconds);

                await Task.Delay(delay);
                delay *= 2;
            }
        }
    }

    public async Task SendVerificationEmailAsync(string email, string verificationCode, string firstName)
    {
        using var client = new SmtpClient(_emailSettings.SmtpServer, _emailSettings.SmtpPort);
        client.EnableSsl = _emailSettings.EnableSsl;

        if (_emailSettings.UseAuthentication)
        {
            client.Credentials = new NetworkCredential(_emailSettings.UserName, _emailSettings.Password);
        }
        else
        {
            client.Credentials = null;
        }

        var mailMessage = new MailMessage
        {
            From = new MailAddress(_emailSettings.SenderEmail, _emailSettings.SenderName),
            Subject = "Verify your email address",
            Body = $"""
            Hello {firstName},

            Please use the following code to verify your email address:

            Verification Code: {verificationCode}

            This code will expire in 24 hours.

            If you didn't create an account, please ignore this email.

            Best regards,
            {_emailSettings.SenderName}
            """,
            IsBodyHtml = false
        };

        mailMessage.To.Add(email);

        await SendWithRetryAsync(mailMessage);
    }

    public async Task SendPasswordResetEmailAsync(string email, string resetCode, string firstName)
    {
        using var client = new SmtpClient(_emailSettings.SmtpServer, _emailSettings.SmtpPort);
        client.EnableSsl = _emailSettings.EnableSsl;

        if (_emailSettings.UseAuthentication)
        {
            client.Credentials = new NetworkCredential(_emailSettings.UserName, _emailSettings.Password);
        }
        else
        {
            client.Credentials = null;
        }

        var mailMessage = new MailMessage
        {
            From = new MailAddress(_emailSettings.SenderEmail, _emailSettings.SenderName),
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

        await SendWithRetryAsync(mailMessage);
    }

    public async Task SendNotificationEmailAsync(string email, string title, string message)
    {
        using var client = new SmtpClient(_emailSettings.SmtpServer, _emailSettings.SmtpPort);
        client.EnableSsl = _emailSettings.EnableSsl;
        if (_emailSettings.UseAuthentication)
            client.Credentials = new NetworkCredential(_emailSettings.UserName, _emailSettings.Password);

        var mailMessage = new MailMessage
        {
            From = new MailAddress(_emailSettings.SenderEmail, _emailSettings.SenderName),
            Subject = title,
            Body = $"""
                Hello!
                
                You have a new notification in Subscription Manager:
                
                {message}
                
                Best regards,
                {_emailSettings.SenderName}
                """,
            IsBodyHtml = false
        };
        mailMessage.To.Add(email);

        await SendWithRetryAsync(mailMessage);
    }
}