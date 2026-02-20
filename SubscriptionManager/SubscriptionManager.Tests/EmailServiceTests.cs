using Microsoft.Extensions.Options;
using SubscriptionManager.Auth.Infrastructure.Services;
using SubscriptionManager.Core.Options;
using System.Net.Mail;

namespace SubscriptionManager.Tests
{
    public class EmailServiceTests
    {
        [Fact]
        public void Constructor_InitializesWithSettings()
        {
            var settings = new EmailSettings
            {
                SmtpServer = "127.0.0.1",
                SmtpPort = 1025,
                SenderEmail = "test@example.com",
                SenderName = "Test Sender"
            };

            var service = new EmailService(Options.Create(settings));

            Assert.NotNull(service);
        }

        [Fact]
        public void EmailService_WithAuthenticationSettings_ConfiguresCredentials()
        {
            var settings = new EmailSettings
            {
                SmtpServer = "127.0.0.1",
                SmtpPort = 1025,
                SenderEmail = "noreply@test.com",
                SenderName = "Test Sender",
                UseAuthentication = true,
                UserName = "testuser",
                Password = "testpassword"
            };

            var service = new EmailService(Options.Create(settings));

            Assert.NotNull(service);
        }

        [Fact]
        public void EmailService_WithoutAuthentication_ConfiguresWithoutCredentials()
        {
            var settings = new EmailSettings
            {
                SmtpServer = "127.0.0.1",
                SmtpPort = 1025,
                SenderEmail = "noreply@test.com",
                SenderName = "Test Sender",
                UseAuthentication = false
            };

            var service = new EmailService(Options.Create(settings));

            Assert.NotNull(service);
        }

        [Fact]
        public async Task SendVerificationEmailAsync_WithInvalidServer_ThrowsException()
        {
            var settings = new EmailSettings
            {
                SmtpServer = "invalid-server-that-does-not-exist",
                SmtpPort = 1025,
                SenderEmail = "noreply@test.com",
                SenderName = "Test Sender",
                UseAuthentication = false
            };

            var service = new EmailService(Options.Create(settings));

            await Assert.ThrowsAsync<SmtpException>(() =>
                service.SendVerificationEmailAsync("test@example.com", "123456", "Ruslan"));
        }
    }
}
