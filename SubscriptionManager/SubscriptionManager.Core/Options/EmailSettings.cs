using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SubscriptionManager.Core.Options
{
    public class EmailSettings
    {
        public const string SectionName = "EmailSettings";

        public string SmtpServer { get; set; } = "localhost";
        public int SmtpPort { get; set; } = 1025;
        public string SenderEmail { get; set; } = "noreply@subscriptionmanager.com";
        public string SenderName { get; set; } = "Subscription Manager";
        public bool EnableSsl { get; set; } = false;
        public bool UseAuthentication { get; set; } = false;
        public string UserName { get; set; } = "testuser";
        public string Password { get; set; } = "testpassword";
    }
}
