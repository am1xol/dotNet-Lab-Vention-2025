using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using SubscriptionManager.Auth.API.Controllers;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Models;
using System.Security.Claims;

namespace SubscriptionManager.Tests;

public class FeedbackControllerTests
{
    private readonly Mock<IFeedbackRepository> _feedbackRepositoryMock = new();
    private readonly FeedbackController _controller;

    public FeedbackControllerTests()
    {
        var logger = new Mock<ILogger<FeedbackController>>();
        _controller = new FeedbackController(_feedbackRepositoryMock.Object, logger.Object);
    }

    [Fact]
    public async Task CreateOrUpdateFeedback_WithRatingBelowRange_ReturnsBadRequest()
    {
        SetUser(Guid.NewGuid());

        var result = await _controller.CreateOrUpdateFeedback(new Core.DTOs.CreateFeedbackRequest
        {
            Rating = 0,
            Comment = "bad input"
        });

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("Rating must be between 1 and 5", badRequest.Value);
        _feedbackRepositoryMock.Verify(x => x.CreateOrUpdateFeedbackAsync(It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<string?>()), Times.Never);
    }

    [Fact]
    public async Task CreateOrUpdateFeedback_DuringCooldown_ReturnsTooManyRequestsAndRetryAfter()
    {
        var userId = Guid.NewGuid();
        SetUser(userId);
        _feedbackRepositoryMock
            .Setup(x => x.GetFeedbackByUserIdAsync(userId))
            .ReturnsAsync(new Feedback
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Rating = 5,
                Comment = "recent update",
                UpdatedAt = DateTime.UtcNow.AddSeconds(-10)
            });

        var result = await _controller.CreateOrUpdateFeedback(new Core.DTOs.CreateFeedbackRequest
        {
            Rating = 5,
            Comment = "new"
        });

        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status429TooManyRequests, objectResult.StatusCode);
        Assert.True(_controller.Response.Headers.ContainsKey("Retry-After"));
        _feedbackRepositoryMock.Verify(x => x.CreateOrUpdateFeedbackAsync(It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<string?>()), Times.Never);
    }

    private void SetUser(Guid userId, string role = "User")
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role)
        };

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Test"))
            }
        };
    }
}
