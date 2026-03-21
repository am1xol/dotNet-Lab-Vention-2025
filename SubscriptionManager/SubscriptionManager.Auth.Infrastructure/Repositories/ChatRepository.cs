using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Microsoft.Extensions.Configuration;
using SubscriptionManager.Core.DTOs;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Models;

namespace SubscriptionManager.Auth.Infrastructure.Repositories;

public class ChatRepository : IChatRepository
{
    private readonly string _connectionString;

    public ChatRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("AuthConnection")
            ?? throw new InvalidOperationException("Connection string 'AuthConnection' not found.");
    }

    private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

    public async Task<ChatConversation?> GetConversationByUserIdAsync(Guid userId)
    {
        const string sql = @"
            SELECT * FROM [ChatConversations] 
            WHERE [UserId] = @UserId";
        
        using var connection = CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<ChatConversation>(
            sql,
            new { UserId = userId });
    }

    public async Task<ChatConversation?> GetConversationByIdAsync(Guid conversationId)
    {
        const string sql = "SELECT * FROM [ChatConversations] WHERE [Id] = @Id";
        using var connection = CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<ChatConversation>(
            sql,
            new { Id = conversationId });
    }

    public async Task<ChatConversation> GetOrCreateConversationAsync(Guid userId)
    {
        const string sql = "sp_ChatConversations_GetOrCreate";
        using var connection = CreateConnection();
        
        var conversation = await connection.QueryFirstOrDefaultAsync<ChatConversation>(
            sql,
            new { UserId = userId },
            commandType: CommandType.StoredProcedure);
        
        return conversation ?? throw new InvalidOperationException("Failed to create conversation");
    }

    public async Task<IEnumerable<ChatConversationDto>> GetAllConversationsAsync(string? status = null)
    {
        const string sql = @"
            SELECT 
                c.*,
                u.FirstName AS UserFirstName,
                u.LastName AS UserLastName,
                u.Email AS UserEmail,
                (SELECT COUNT(*) FROM [ChatMessages] m 
                 WHERE m.ConversationId = c.Id AND m.IsRead = 0 AND m.SenderRole = 'User') AS UnreadCount
            FROM [ChatConversations] c
            INNER JOIN [Users] u ON c.UserId = u.Id
            WHERE (@Status IS NULL OR c.Status = @Status)
            ORDER BY c.LastMessageAt DESC";
        
        using var connection = CreateConnection();
        return await connection.QueryAsync<ChatConversationDto>(
            sql,
            new { Status = status });
    }

    public async Task UpdateConversationStatusAsync(Guid conversationId, string status, Guid? adminId = null)
    {
        const string sql = "sp_ChatConversations_UpdateStatus";
        using var connection = CreateConnection();
        await connection.ExecuteAsync(
            sql,
            new { Id = conversationId, Status = status, AdminId = adminId },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<ChatMessage> AddMessageAsync(Guid conversationId, Guid senderId, string senderRole, string content)
    {
        const string sql = "sp_ChatMessages_Insert";
        using var connection = CreateConnection();
        
        var message = await connection.QueryFirstAsync<ChatMessage>(
            sql,
            new
            {
                Id = Guid.NewGuid(),
                ConversationId = conversationId,
                SenderId = senderId,
                SenderRole = senderRole,
                Content = content
            },
            commandType: CommandType.StoredProcedure);
        
        return message;
    }

    public async Task<IEnumerable<ChatMessageDto>> GetMessagesByConversationAsync(Guid conversationId)
    {
        const string sql = @"
            SELECT 
                m.*,
                u.FirstName AS SenderFirstName,
                u.LastName AS SenderLastName
            FROM [ChatMessages] m
            INNER JOIN [Users] u ON m.SenderId = u.Id
            WHERE m.ConversationId = @ConversationId
            ORDER BY m.CreatedAt ASC";
        
        using var connection = CreateConnection();
        return await connection.QueryAsync<ChatMessageDto>(
            sql,
            new { ConversationId = conversationId });
    }

    public async Task<IEnumerable<ChatMessageDto>> GetUnreadMessagesForAdminAsync()
    {
        const string sql = "sp_ChatMessages_GetUnreadForAdmin";
        using var connection = CreateConnection();
        return await connection.QueryAsync<ChatMessageDto>(
            sql,
            commandType: CommandType.StoredProcedure);
    }

    public async Task MarkMessagesAsReadAsync(Guid conversationId, Guid readerId)
    {
        const string sql = "sp_ChatMessages_MarkAsRead";
        using var connection = CreateConnection();
        await connection.ExecuteAsync(
            sql,
            new { ConversationId = conversationId, ReaderId = readerId },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<int> GetUnreadCountForUserAsync(Guid conversationId, Guid userId)
    {
        const string sql = @"
            SELECT COUNT(*) FROM [ChatMessages] 
            WHERE ConversationId = @ConversationId 
            AND IsRead = 0 
            AND SenderId != @UserId";
        
        using var connection = CreateConnection();
        return await connection.ExecuteScalarAsync<int>(
            sql,
            new { ConversationId = conversationId, UserId = userId });
    }

    public async Task<ChatConversation> CreateNewConversationAsync(Guid userId)
    {
        var existingConversation = await GetConversationByUserIdAsync(userId);
        if (existingConversation != null && existingConversation.Status == ChatConversationStatus.Open)
        {
            return existingConversation;
        }

        if (existingConversation != null && existingConversation.Status == ChatConversationStatus.Closed)
        {
            await UpdateConversationStatusAsync(existingConversation.Id, "Open");
            return await GetConversationByIdAsync(existingConversation.Id) 
                ?? throw new InvalidOperationException("Failed to reopen conversation");
        }

        const string sql = @"
            INSERT INTO [ChatConversations] (Id, UserId, Status, CreatedAt, UpdatedAt, LastMessageAt)
            VALUES (@Id, @UserId, 'Open', @CreatedAt, @UpdatedAt, @LastMessageAt);
            SELECT * FROM [ChatConversations] WHERE Id = @Id;";

        using var connection = CreateConnection();
        var newConversation = await connection.QueryFirstAsync<ChatConversation>(
            sql,
            new
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                LastMessageAt = DateTime.UtcNow
            });

        return newConversation;
    }
}