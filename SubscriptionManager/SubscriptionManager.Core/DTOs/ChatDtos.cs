namespace SubscriptionManager.Core.DTOs
{
    public class ChatConversationDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid? AdminId { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? LastMessageAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        
        public string? UserFirstName { get; set; }
        public string? UserLastName { get; set; }
        public string? UserEmail { get; set; }
        public int UnreadCount { get; set; }
    }

    public class ChatMessageDto
    {
        public Guid Id { get; set; }
        public Guid ConversationId { get; set; }
        public Guid SenderId { get; set; }
        public string SenderRole { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
        
        public string? SenderFirstName { get; set; }
        public string? SenderLastName { get; set; }
    }

    public class SendMessageRequest
    {
        public string Content { get; set; } = string.Empty;
    }

    public class UpdateConversationStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }

    public class ChatWithUserDto
    {
        public ChatConversationDto Conversation { get; set; } = null!;
        public List<ChatMessageDto> Messages { get; set; } = new();
    }
}
