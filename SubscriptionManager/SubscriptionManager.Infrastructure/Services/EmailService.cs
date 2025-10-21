using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using SubscriptionManager.Core.Interfaces;

namespace SubscriptionManager.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;

    public EmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendVerificationEmailAsync(string email, string verificationCode, string firstName)
    {
        using var client = new SmtpClient("localhost", 1025);
        client.EnableSsl = false;
        client.Credentials = null;

        var mailMessage = new MailMessage
        {
            From = new MailAddress("noreply@subscriptionmanager.com"),
            Subject = "Verify your email address",
            Body = $"""
            Hello {firstName},

            Please use the following code to verify your email address:

            Verification Code: {verificationCode}

            This code will expire in 24 hours.

            If you didn't create an account, please ignore this email.

            Best regards,
            Subscription Manager Team
            """,
            IsBodyHtml = false
        };

        mailMessage.To.Add(email);

        await client.SendMailAsync(mailMessage);
    }
}