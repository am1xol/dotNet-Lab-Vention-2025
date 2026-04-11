using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Microsoft.Extensions.Configuration;
using SubscriptionManager.Core.DTOs;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Models;

namespace SubscriptionManager.Auth.Infrastructure.Repositories;

public class FeedbackRepository : IFeedbackRepository
{
    private readonly string _connectionString;

    public FeedbackRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("AuthConnection")
            ?? throw new InvalidOperationException("Connection string 'AuthConnection' not found.");
    }

    private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

    public async Task<Feedback?> GetFeedbackByUserIdAsync(Guid userId)
    {
        const string sql = "sp_Feedbacks_GetByUserId";
        using var connection = CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<Feedback>(
            sql,
            new { UserId = userId },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<Feedback> CreateOrUpdateFeedbackAsync(Guid userId, int rating, string? comment)
    {
        const string sql = "sp_Feedbacks_Upsert";
        using var connection = CreateConnection();
        
        var feedback = await connection.QueryFirstAsync<Feedback>(
            sql,
            new
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Rating = rating,
                Comment = comment,
                CreatedAt = DateTime.UtcNow
            },
            commandType: CommandType.StoredProcedure);
        
        return feedback;
    }

    public async Task<PagedFeedbackResult> GetAllFeedbacksAsync(int pageNumber, int pageSize)
    {
        const string sql = "sp_Feedbacks_GetAll";
        using var connection = CreateConnection();
        
        using var multi = await connection.QueryMultipleAsync(
            sql,
            new { PageNumber = pageNumber, PageSize = pageSize },
            commandType: CommandType.StoredProcedure);
        
        var feedbacks = (await multi.ReadAsync<FeedbackDto>()).ToList();
        var totalCount = await multi.ReadFirstAsync<int>();
        
        // Дополнительно получим данные пользователей
        var result = new PagedFeedbackResult
        {
            Items = new List<FeedbackWithUserDto>(),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
        
        foreach (var feedback in feedbacks)
        {
            const string userSql = "SELECT FirstName, LastName, Email FROM [Users] WHERE Id = @UserId";
            var userInfo = await connection.QueryFirstOrDefaultAsync<dynamic>(
                userSql,
                new { UserId = feedback.UserId });
            
            result.Items.Add(new FeedbackWithUserDto
            {
                Feedback = feedback,
                UserFirstName = userInfo?.FirstName ?? "",
                UserLastName = userInfo?.LastName ?? "",
                UserEmail = userInfo?.Email ?? ""
            });
        }
        
        return result;
    }

    public async Task<FeedbackStatisticsDto> GetAverageRatingAsync()
    {
        const string sql = "sp_Feedbacks_GetAverageRating";
        using var connection = CreateConnection();
        
        var result = await connection.QueryFirstOrDefaultAsync<FeedbackStatisticsDto>(
            sql,
            commandType: CommandType.StoredProcedure);
        
        return result ?? new FeedbackStatisticsDto { TotalCount = 0, AverageRating = 0 };
    }

    public async Task<PublicFeedbackSummaryDto> GetPublicFeedbackSummaryAsync(int recentTake)
    {
        var stats = await GetAverageRatingAsync();
        if (stats.TotalCount == 0)
        {
            stats.AverageRating = 0;
        }

        const string sql = "sp_Feedbacks_GetRecentPublic";
        using var connection = CreateConnection();

        var rows = await connection.QueryAsync<FeedbackRecentRow>(
            sql,
            new { Take = recentTake },
            commandType: CommandType.StoredProcedure);

        const int maxCommentLength = 500;
        var reviews = rows.Select(r => new PublicFeedbackReviewDto
        {
            Id = r.Id,
            Rating = r.Rating,
            Comment = TruncateComment(r.Comment, maxCommentLength),
            UpdatedAt = r.UpdatedAt,
            DisplayName = FormatPublicDisplayName(r.FirstName, r.LastName),
        }).ToList();

        return new PublicFeedbackSummaryDto
        {
            TotalCount = stats.TotalCount,
            AverageRating = stats.TotalCount == 0 ? 0 : stats.AverageRating,
            RecentReviews = reviews,
        };
    }

    private static string? TruncateComment(string? comment, int maxLen)
    {
        if (string.IsNullOrWhiteSpace(comment))
        {
            return null;
        }

        var t = comment.Trim();
        return t.Length <= maxLen ? t : t[..maxLen].TrimEnd() + "…";
    }

    private static string FormatPublicDisplayName(string? firstName, string? lastName)
    {
        var fn = (firstName ?? string.Empty).Trim();
        var ln = (lastName ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(fn))
        {
            return "Пользователь";
        }

        if (string.IsNullOrEmpty(ln))
        {
            return fn;
        }

        var initial = char.ToUpperInvariant(ln[0]);
        return $"{fn} {initial}.";
    }

    private sealed class FeedbackRecentRow
    {
        public Guid Id { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
    }
}
