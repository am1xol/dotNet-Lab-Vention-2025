using SubscriptionManager.Core.Models;

namespace SubscriptionManager.Core.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<bool> ExistsByEmailAsync(string email);
    Task<User?> GetByIdAsync(Guid id);
    Task AddAsync(User user);
    Task SaveChangesAsync();
    Task<IEnumerable<User>> GetAllUsersAsync();
    Task UpdateAsync(User user);
    Task<(IEnumerable<User> Items, int TotalCount)> GetPagedUsersAsync(int pageNumber, int pageSize, string? searchTerm);
    Task<bool> IsEmailTakenAsync(string email, Guid excludeUserId);
    Task UpdateResetCodeAsync(Guid userId, string resetCode, DateTime expiresAt);
    Task UpdatePasswordAsync(Guid userId, string passwordHash);
    Task VerifyEmailAsync(Guid userId);
    Task UpdateEmailVerificationCodeAsync(Guid userId, string verificationCode, DateTime expiresAt, DateTime updatedAt);
}
