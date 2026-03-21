namespace SubscriptionManager.Core.Models
{
    public class ChatMessage
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid ConversationId { get; set; }
        public Guid SenderId { get; set; }
        public ChatSenderRole SenderRole { get; set; }
        public string Content { get; set; } = string.Empty;
        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public ChatConversation? Conversation { get; set; }
        public User? Sender { get; set; }
    }

    public enum ChatSenderRole
    {
        User,
        Admin
    }
}
