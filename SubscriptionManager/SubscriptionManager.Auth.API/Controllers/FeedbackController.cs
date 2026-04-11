using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubscriptionManager.Core.DTOs;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Constants;
using System.Security.Claims;

namespace SubscriptionManager.Auth.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FeedbackController : ControllerBase
    {
        private const int FeedbackUpdateCooldownSeconds = 60;
        private readonly IFeedbackRepository _feedbackRepository;
        private readonly ILogger<FeedbackController> _logger;

        public FeedbackController(
            IFeedbackRepository feedbackRepository,
            ILogger<FeedbackController> logger)
        {
            _feedbackRepository = feedbackRepository;
            _logger = logger;
        }

        private Guid GetUserIdFromClaims()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                throw new UnauthorizedAccessException("Invalid token");
            }
            return userId;
        }

        private string GetUserRole()
        {
            return User.FindFirst(ClaimTypes.Role)?.Value ?? "User";
        }

        private bool IsAdmin()
        {
            return GetUserRole() == RoleConstants.Admin;
        }

        [HttpGet("my")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<FeedbackDto>> GetMyFeedback()
        {
            try
            {
                var userId = GetUserIdFromClaims();
                var feedback = await _feedbackRepository.GetFeedbackByUserIdAsync(userId);

                if (feedback == null)
                {
                    return NotFound("Feedback not found");
                }

                var feedbackDto = new FeedbackDto
                {
                    Id = feedback.Id,
                    UserId = feedback.UserId,
                    Rating = feedback.Rating,
                    Comment = feedback.Comment,
                    CreatedAt = feedback.CreatedAt,
                    UpdatedAt = feedback.UpdatedAt
                };

                return Ok(feedbackDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user feedback");
                return Problem(title: ex.Message, statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        [HttpPost]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<FeedbackDto>> CreateOrUpdateFeedback([FromBody] CreateFeedbackRequest request)
        {
            try
            {
                if (request.Rating < 1 || request.Rating > 5)
                {
                    return BadRequest("Rating must be between 1 and 5");
                }

                var userId = GetUserIdFromClaims();
                var currentFeedback = await _feedbackRepository.GetFeedbackByUserIdAsync(userId);
                if (currentFeedback != null)
                {
                    var retryAfter = currentFeedback.UpdatedAt.AddSeconds(FeedbackUpdateCooldownSeconds) - DateTime.UtcNow;
                    if (retryAfter > TimeSpan.Zero)
                    {
                        Response.Headers["Retry-After"] = Math.Ceiling(retryAfter.TotalSeconds).ToString();
                        return StatusCode(
                            StatusCodes.Status429TooManyRequests,
                            $"Feedback can be updated once per {FeedbackUpdateCooldownSeconds} seconds. Try again in {FormatRetryAfter(retryAfter)}.");
                    }
                }

                var feedback = await _feedbackRepository.CreateOrUpdateFeedbackAsync(
                    userId, 
                    request.Rating, 
                    request.Comment);

                var feedbackDto = new FeedbackDto
                {
                    Id = feedback.Id,
                    UserId = feedback.UserId,
                    Rating = feedback.Rating,
                    Comment = feedback.Comment,
                    CreatedAt = feedback.CreatedAt,
                    UpdatedAt = feedback.UpdatedAt
                };

                return Ok(feedbackDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating/updating feedback");
                return Problem(title: ex.Message, statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        private static string FormatRetryAfter(TimeSpan retryAfter)
        {
            var totalSeconds = (int)Math.Ceiling(retryAfter.TotalSeconds);
            if (totalSeconds <= 60)
            {
                return $"{totalSeconds} sec";
            }

            var minutes = (int)Math.Ceiling(totalSeconds / 60.0);
            return $"{minutes} min";
        }

        [HttpGet("public-summary")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<PublicFeedbackSummaryDto>> GetPublicFeedbackSummary(
            [FromQuery] int recentCount = 8)
        {
            try
            {
                if (recentCount < 1) recentCount = 8;
                if (recentCount > 50) recentCount = 50;

                var summary = await _feedbackRepository.GetPublicFeedbackSummaryAsync(recentCount);
                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting public feedback summary");
                return Problem(title: ex.Message, statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<PagedFeedbackResult>> GetAllFeedbacks(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                if (pageNumber < 1) pageNumber = 1;
                if (pageSize < 1) pageSize = 10;
                if (pageSize > 50) pageSize = 50;

                var result = await _feedbackRepository.GetAllFeedbacksAsync(pageNumber, pageSize);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all feedbacks");
                return Problem(title: ex.Message, statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        [HttpGet("statistics")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<FeedbackStatisticsDto>> GetStatistics()
        {
            try
            {
                var stats = await _feedbackRepository.GetAverageRatingAsync();
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting feedback statistics");
                return Problem(title: ex.Message, statusCode: StatusCodes.Status500InternalServerError);
            }
        }
    }
}
