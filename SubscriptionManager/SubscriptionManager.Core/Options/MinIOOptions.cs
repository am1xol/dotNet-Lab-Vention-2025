using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SubscriptionManager.Core.Options
{
    public class MinIOOptions
    {
        public const string SectionName = "MinIO";

        public string Endpoint { get; set; } = "minio:9000";
        public string ExternalEndpoint { get; set; } = "127.0.0.1:9000";
        public string AccessKey { get; set; } = "minioadmin";
        public string SecretKey { get; set; } = "minioadmin";
        public string BucketName { get; set; } = "subscriptions";
        public bool WithSSL { get; set; } = false;
    }
}
