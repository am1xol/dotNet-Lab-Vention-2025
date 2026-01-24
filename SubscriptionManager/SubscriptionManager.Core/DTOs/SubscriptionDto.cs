using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SubscriptionManager.Core.DTOs
{
    public class SubscriptionDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string DescriptionMarkdown { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Period { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public Guid? IconFileId { get; set; }
        public string? IconUrl { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateSubscriptionRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string DescriptionMarkdown { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Period { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public Guid? IconFileId { get; set; }
    }

    public class UpdateSubscriptionRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string DescriptionMarkdown { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Period { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public Guid? IconFileId { get; set; }
    }
}
