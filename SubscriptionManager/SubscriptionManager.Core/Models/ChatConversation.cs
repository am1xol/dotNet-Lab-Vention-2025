namespace SubscriptionManager.Core.Models
{
    public class ChatConversation
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public Guid? AdminId { get; set; }
        public ChatConversationStatus Status { get; set; } = ChatConversationStatus.Open;
        public DateTime? LastMessageAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        public User? User { get; set; }
        public User? Admin { get; set; }
        public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
    }

    public enum ChatConversationStatus
    {
        Open,
        Closed
    }
}
