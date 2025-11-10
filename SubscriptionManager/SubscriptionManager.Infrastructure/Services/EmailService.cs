using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;

namespace SubscriptionManager.Infrastructure.Services;

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
}