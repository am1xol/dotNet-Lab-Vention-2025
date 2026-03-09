using Dapper;
using System.Data;
using Microsoft.Extensions.Configuration;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Models;
using Microsoft.Data.SqlClient;

namespace SubscriptionManager.Auth.Infrastructure.Repositories;

public class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly string _connectionString;

    public RefreshTokenRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("AuthConnection")
            ?? throw new InvalidOperationException("Connection string 'AuthConnection' not found.");
    }

    private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

    public async Task<RefreshToken?> GetByTokenAsync(string token)
    {
        const string sql = "sp_RefreshTokens_GetByTokenWithUser";
        using var connection = CreateConnection();

        var result = await connection.QueryAsync<RefreshToken, User, RefreshToken>(
            sql,
            (refreshToken, user) =>
            {
                refreshToken.User = user;
                return refreshToken;
            },
            new { Token = token },
            splitOn: "UserId",
            commandType: CommandType.StoredProcedure);

        return result.FirstOrDefault();
    }

    public async Task AddAsync(RefreshToken refreshToken)
    {
        const string sql = "sp_RefreshTokens_Insert";
        using var connection = CreateConnection();

        await connection.ExecuteAsync(
            sql,
            new
            {
                Id = refreshToken.Id == Guid.Empty ? Guid.NewGuid() : refreshToken.Id,
                refreshToken.UserId,
                refreshToken.Token,
                refreshToken.DeviceName,
                refreshToken.ExpiresAt,
                CreatedAt = DateTime.UtcNow
            },
            commandType: CommandType.StoredProcedure);
    }

    public Task UpdateAsync(RefreshToken refreshToken)
    {
        const string sql = "sp_RefreshTokens_Update";
        using var connection = CreateConnection();

        return connection.ExecuteAsync(
            sql,
            new { refreshToken.Id, refreshToken.IsRevoked },
            commandType: CommandType.StoredProcedure);
    }

    public async Task RevokeAllUserTokensAsync(Guid userId)
    {
        const string sql = "sp_RefreshTokens_RevokeAllUserTokens";
        using var connection = CreateConnection();

        await connection.ExecuteAsync(
            sql,
            new { UserId = userId },
            commandType: CommandType.StoredProcedure);
    }

    public Task SaveChangesAsync() => Task.CompletedTask;
}