using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Microsoft.Extensions.Configuration;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Models;

namespace SubscriptionManager.Auth.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly string _connectionString;

    public UserRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("AuthConnection")
            ?? throw new InvalidOperationException("Connection string 'AuthConnection' not found.");
    }

    private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

    public async Task<User?> GetByEmailAsync(string email)
    {
        const string sql = "sp_Users_GetByEmail";
        using var connection = CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<User>(
            sql,
            new { Email = email },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<bool> ExistsByEmailAsync(string email)
    {
        var user = await GetByEmailAsync(email);
        return user != null;
    }

    public async Task AddAsync(User user)
    {
        const string sql = "sp_Users_Insert";
        using var connection = CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            user.Id,
            user.Email,
            user.PasswordHash,
            user.FirstName,
            user.LastName,
            user.Role,
            user.CreatedAt,
            user.UpdatedAt,
            user.EmailVerificationCode,
            user.EmailVerificationCodeExpiresAt
        }, commandType: CommandType.StoredProcedure);
    }

    public Task SaveChangesAsync() => Task.CompletedTask;

    public async Task<IEnumerable<User>> GetAllUsersAsync()
    {
        const string sql = "sp_Users_GetPaged";
        var parameters = new DynamicParameters();
        parameters.Add("@PageNumber", 1);
        parameters.Add("@PageSize", int.MaxValue);
        parameters.Add("@SearchTerm", null);
        parameters.Add("@TotalCount", dbType: DbType.Int32, direction: ParameterDirection.Output);

        using var connection = CreateConnection();
        var users = await connection.QueryAsync<User>(
            sql,
            parameters,
            commandType: CommandType.StoredProcedure);

        return users;
    }

    public async Task<(IEnumerable<User> Items, int TotalCount)> GetPagedUsersAsync(
        int pageNumber, int pageSize, string? searchTerm)
    {
        const string sql = "sp_Users_GetPaged";
        var parameters = new DynamicParameters();
        parameters.Add("@PageNumber", pageNumber);
        parameters.Add("@PageSize", pageSize);
        parameters.Add("@SearchTerm", searchTerm);
        parameters.Add("@TotalCount", dbType: DbType.Int32, direction: ParameterDirection.Output);

        using var connection = CreateConnection();
        var items = await connection.QueryAsync<User>(
            sql,
            parameters,
            commandType: CommandType.StoredProcedure);

        var totalCount = parameters.Get<int>("@TotalCount");
        return (items, totalCount);
    }

    public async Task UpdateAsync(User user)
    {
        const string sql = "sp_Users_Update";
        using var connection = CreateConnection();
        await connection.ExecuteAsync(
            sql,
            new
            {
                user.Id,
                user.FirstName,
                user.LastName,
                user.Email,
                user.PasswordHash,
                user.Role,
                user.IsBlocked
            },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<bool> IsEmailTakenAsync(string email, Guid excludeUserId)
    {
        const string sql = "sp_Users_IsEmailTaken";
        using var connection = CreateConnection();
        return await connection.ExecuteScalarAsync<bool>(
            sql,
            new { Email = email, ExcludeUserId = excludeUserId },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<User?> GetByIdAsync(Guid id)
    {
        const string sql = "sp_Users_GetById";
        using var connection = CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<User>(
            sql,
            new { Id = id },
            commandType: CommandType.StoredProcedure);
    }

    public async Task UpdateResetCodeAsync(Guid userId, string resetCode, DateTime expiresAt)
    {
        const string sql = "sp_Users_UpdateResetCode";
        using var connection = CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            Id = userId,
            PasswordResetCode = resetCode,
            PasswordResetExpiresAt = expiresAt
        }, commandType: CommandType.StoredProcedure);
    }

    public async Task UpdatePasswordAsync(Guid userId, string passwordHash)
    {
        const string sql = "sp_Users_UpdatePassword";
        using var connection = CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            Id = userId,
            PasswordHash = passwordHash
        }, commandType: CommandType.StoredProcedure);
    }

    public async Task VerifyEmailAsync(Guid userId)
    {
        const string sql = "sp_Users_VerifyEmail";
        using var connection = CreateConnection();
        await connection.ExecuteAsync(sql, new { Id = userId }, commandType: CommandType.StoredProcedure);
    }
}