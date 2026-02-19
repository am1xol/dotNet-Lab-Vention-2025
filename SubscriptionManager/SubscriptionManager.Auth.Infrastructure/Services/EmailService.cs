using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Options;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;
using static System.Net.Mime.MediaTypeNames;

namespace SubscriptionManager.Auth.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly EmailSettings _emailSettings;

    public EmailService(IOptions<EmailSettings> emailSettings)
    {
        _emailSettings = emailSettings.Value;
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

        await client.SendMailAsync(mailMessage);
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

        await client.SendMailAsync(mailMessage);
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

        await client.SendMailAsync(mailMessage);
    }
}