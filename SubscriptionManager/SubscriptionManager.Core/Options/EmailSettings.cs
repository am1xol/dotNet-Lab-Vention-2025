namespace SubscriptionManager.Core.Options
{
    public class EmailSettings
    {
        public const string SectionName = "EmailSettings";

        public string SmtpServer { get; set; } = "127.0.0.1";
        public int SmtpPort { get; set; } = 1025;
        public string SenderEmail { get; set; } = "noreply@subscriptionmanager.com";
        public string SenderName { get; set; } = "Subscription Manager";
        public bool EnableSsl { get; set; } = false;
        public bool UseAuthentication { get; set; } = false;
        public string UserName { get; set; } = "testuser";
        public string Password { get; set; } = "testpassword";
        public int TimeoutMs { get; set; } = 10000;
        public bool EnableSecondaryDelivery { get; set; } = false;
        public string SecondarySmtpServer { get; set; } = string.Empty;
        public int SecondarySmtpPort { get; set; } = 465;
        public bool SecondaryEnableSsl { get; set; } = true;
        public bool SecondaryUseAuthentication { get; set; } = true;
        public string SecondaryUserName { get; set; } = string.Empty;
        public string SecondaryPassword { get; set; } = string.Empty;
        public string SecondarySenderEmail { get; set; } = string.Empty;
        public string SecondarySenderName { get; set; } = string.Empty;
        public int SecondaryTimeoutMs { get; set; } = 5000;
    }
}
