using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SubscriptionManager.Core.Options
{
    public class BePaidOptions
    {
        public const string SectionName = "BePaid";

        public string ShopId { get; set; } = string.Empty;
        public string SecretKey { get; set; } = string.Empty;
        public bool TestMode { get; set; }
        public string ReturnUrl { get; set; } = string.Empty;
        public string NotificationUrl { get; set; } = string.Empty;
        public string ApiUrl { get; set; } = string.Empty;
    }
}
