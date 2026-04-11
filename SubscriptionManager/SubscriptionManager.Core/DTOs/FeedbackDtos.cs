namespace SubscriptionManager.Core.DTOs
{
    public class FeedbackDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        
        public string? UserFirstName { get; set; }
        public string? UserLastName { get; set; }
    }

    public class CreateFeedbackRequest
    {
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }

    public class FeedbackWithUserDto
    {
        public FeedbackDto Feedback { get; set; } = null!;
        public string UserFirstName { get; set; } = string.Empty;
        public string UserLastName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
    }

    public class PagedFeedbackResult
    {
        public List<FeedbackWithUserDto> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
    }

    public class FeedbackStatisticsDto
    {
        public int TotalCount { get; set; }
        public double AverageRating { get; set; }
    }

    public class PublicFeedbackSummaryDto
    {
        public int TotalCount { get; set; }
        public double AverageRating { get; set; }
        public List<PublicFeedbackReviewDto> RecentReviews { get; set; } = new();
    }

    public class PublicFeedbackReviewDto
    {
        public Guid Id { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string DisplayName { get; set; } = string.Empty;
    }
}
