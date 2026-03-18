using Dapper;
using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Models;

namespace SubscriptionManager.Auth.Infrastructure.Repositories;

public class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly string _connectionString;
    private readonly ILogger<RefreshTokenRepository> _logger;

    public RefreshTokenRepository(IConfiguration configuration, ILogger<RefreshTokenRepository> logger)
    {
        _connectionString = configuration.GetConnectionString("AuthConnection")
            ?? throw new InvalidOperationException("Connection string 'AuthConnection' not found.");
        _logger = logger;
    }

    private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

    public async Task<RefreshToken?> GetByTokenAsync(string token)
    {
        _logger.LogInformation("GetByTokenAsync - Looking for token: {Token}", token);
        
        const string sql = @"
            SELECT rt.Id, rt.UserId, rt.Token, rt.DeviceName, rt.ExpiresAt, rt.CreatedAt, rt.IsRevoked,
                   u.Id AS Id, u.Email, u.PasswordHash, u.FirstName, u.LastName, 
                   u.IsEmailVerified, u.EmailVerificationCode, u.EmailVerificationCodeExpiresAt,
                   u.CreatedAt, u.UpdatedAt, u.Role, u.PasswordResetCode, u.PasswordResetExpiresAt, u.IsBlocked
            FROM [RefreshTokens] rt
            INNER JOIN [Users] u ON rt.[UserId] = u.[Id]
            WHERE rt.[Token] = @Token AND rt.[IsRevoked] = 0 AND rt.[ExpiresAt] > GETUTCDATE()";
            
        using var connection = CreateConnection();
        connection.Open();

        var result = await connection.QueryAsync<RefreshToken, User, RefreshToken>(
            sql,
            (refreshToken, user) =>
            {
                refreshToken.User = user;
                return refreshToken;
            },
            new { Token = token },
            splitOn: "Id");

        _logger.LogInformation("GetByTokenAsync - Query returned {Count} results", result.Count());
        
        var found = result.FirstOrDefault();
        
        if (found != null)
        {
            var expiresAtUtc = DateTime.SpecifyKind(found.ExpiresAt, DateTimeKind.Utc);
            var createdAtUtc = DateTime.SpecifyKind(found.CreatedAt, DateTimeKind.Utc);
            
            _logger.LogInformation("GetByTokenAsync - Found: True, ExpiresAt: {ExpiresAt}, ExpiresAtKind: {Kind}, CreatedAt: {CreatedAt}", 
                expiresAtUtc, expiresAtUtc.Kind, createdAtUtc);
            
            found.ExpiresAt = expiresAtUtc;
            found.CreatedAt = createdAtUtc;
        }
        else
        {
            _logger.LogWarning("GetByTokenAsync - Token not found or expired/revoked");
        }
        
        return found;
    }

    public async Task AddAsync(RefreshToken refreshToken)
    {
        const string sql = @"
            INSERT INTO [RefreshTokens] (Id, UserId, Token, DeviceName, ExpiresAt, CreatedAt, IsRevoked)
            VALUES (@Id, @UserId, @Token, @DeviceName, @ExpiresAt, @CreatedAt, 0)";
            
        using var connection = CreateConnection();
        connection.Open();

        _logger.LogInformation("RefreshTokenRepository.AddAsync - Input ExpiresAt: {ExpiresAt}, Kind: {Kind}", 
            refreshToken.ExpiresAt, refreshToken.ExpiresAt.Kind);

        var expiresAt = refreshToken.ExpiresAt.Kind == DateTimeKind.Utc 
            ? refreshToken.ExpiresAt 
            : refreshToken.ExpiresAt.ToUniversalTime();
            
        if (expiresAt == default || expiresAt < new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc))
        {
            _logger.LogWarning("RefreshTokenRepository.AddAsync - ExpiresAt was invalid, using fallback to 30 days. Original value: {OriginalExpiresAt}", refreshToken.ExpiresAt);
            expiresAt = DateTime.UtcNow.AddDays(30);
        }

        _logger.LogInformation("RefreshTokenRepository.AddAsync - Final ExpiresAt to insert: {ExpiresAt}", expiresAt);

        var createdAt = DateTime.UtcNow;
        
        var parameters = new DynamicParameters();
        parameters.Add("Id", refreshToken.Id == Guid.Empty ? Guid.NewGuid() : refreshToken.Id);
        parameters.Add("UserId", refreshToken.UserId);
        parameters.Add("Token", refreshToken.Token);
        parameters.Add("DeviceName", refreshToken.DeviceName);
        parameters.Add("ExpiresAt", expiresAt, DbType.DateTime2);
        parameters.Add("CreatedAt", createdAt, DbType.DateTime2);
        
        await connection.ExecuteAsync(sql, parameters);
        
        _logger.LogInformation("RefreshTokenRepository.AddAsync - Execute completed");
    }

    public async Task UpdateAsync(RefreshToken refreshToken)
    {
        const string sql = "UPDATE [RefreshTokens] SET [IsRevoked] = @IsRevoked WHERE [Id] = @Id";
        using var connection = CreateConnection();
        connection.Open();

        await connection.ExecuteAsync(sql, new { refreshToken.Id, refreshToken.IsRevoked });
    }

    public async Task RevokeAllUserTokensAsync(Guid userId)
    {
        const string sql = "UPDATE [RefreshTokens] SET [IsRevoked] = 1 WHERE [UserId] = @UserId AND [IsRevoked] = 0";
        using var connection = CreateConnection();
        connection.Open();

        await connection.ExecuteAsync(sql, new { UserId = userId });
    }

    public Task SaveChangesAsync() => Task.CompletedTask;
}