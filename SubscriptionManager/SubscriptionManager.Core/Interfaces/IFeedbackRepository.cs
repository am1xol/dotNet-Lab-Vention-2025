using SubscriptionManager.Core.DTOs;
using SubscriptionManager.Core.Models;

namespace SubscriptionManager.Core.Interfaces
{
    public interface IFeedbackRepository
    {
        Task<Feedback?> GetFeedbackByUserIdAsync(Guid userId);
        Task<Feedback> CreateOrUpdateFeedbackAsync(Guid userId, int rating, string? comment);
        Task<PagedFeedbackResult> GetAllFeedbacksAsync(int pageNumber, int pageSize);
        Task<FeedbackStatisticsDto> GetAverageRatingAsync();
    }
}
