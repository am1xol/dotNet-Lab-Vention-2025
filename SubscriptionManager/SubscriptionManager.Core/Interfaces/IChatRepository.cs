using SubscriptionManager.Core.DTOs;
using SubscriptionManager.Core.Models;

namespace SubscriptionManager.Core.Interfaces
{
    public interface IChatRepository
    {
        Task<ChatConversation?> GetConversationByUserIdAsync(Guid userId);
        Task<ChatConversation?> GetConversationByIdAsync(Guid conversationId);
        Task<ChatConversation> GetOrCreateConversationAsync(Guid userId);
        Task<IEnumerable<ChatConversationDto>> GetAllConversationsAsync(string? status = null);
        Task UpdateConversationStatusAsync(Guid conversationId, string status, Guid? adminId = null);
        
        Task<ChatMessage> AddMessageAsync(Guid conversationId, Guid senderId, string senderRole, string content);
        Task<IEnumerable<ChatMessageDto>> GetMessagesByConversationAsync(Guid conversationId);
        Task<IEnumerable<ChatMessageDto>> GetUnreadMessagesForAdminAsync();
        Task MarkMessagesAsReadAsync(Guid conversationId, Guid readerId);
        Task<int> GetUnreadCountForUserAsync(Guid conversationId, Guid userId);
        Task<ChatConversation> CreateNewConversationAsync(Guid userId);
    }
}