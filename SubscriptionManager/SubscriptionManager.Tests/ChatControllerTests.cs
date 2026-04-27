using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using SubscriptionManager.Auth.API.Controllers;
using SubscriptionManager.Core.DTOs;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Models;
using System.Security.Claims;

namespace SubscriptionManager.Tests;

public class ChatControllerTests
{
    private readonly Mock<IChatRepository> _chatRepositoryMock = new();
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<IEmailService> _emailServiceMock = new();
    private readonly Mock<IProfanityFilter> _profanityFilterMock = new();
    private readonly ChatController _controller;

    public ChatControllerTests()
    {
        var logger = new Mock<ILogger<ChatController>>();
        _profanityFilterMock
            .Setup(x => x.ModerateText(It.IsAny<string>()))
            .Returns<string>(x => x);

        _controller = new ChatController(
            _chatRepositoryMock.Object,
            _userRepositoryMock.Object,
            _emailServiceMock.Object,
            _profanityFilterMock.Object,
            logger.Object);
    }

    [Fact]
    public async Task SendMessage_WithEmptyContent_ReturnsBadRequest()
    {
        SetUser(Guid.NewGuid(), "User");

        var result = await _controller.SendMessage(new SendMessageRequest { Content = "   " });

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("Message content cannot be empty", badRequest.Value);
        _chatRepositoryMock.Verify(x => x.AddMessageAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task SendMessage_FromUserInClosedConversation_ReturnsForbidden()
    {
        var userId = Guid.NewGuid();
        SetUser(userId, "User");
        _chatRepositoryMock
            .Setup(x => x.GetOrCreateConversationAsync(userId))
            .ReturnsAsync(new ChatConversation
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Status = ChatConversationStatus.Closed
            });

        var result = await _controller.SendMessage(new SendMessageRequest { Content = "Need help" });

        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
        _chatRepositoryMock.Verify(x => x.AddMessageAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task AdminSendMessage_WithEmptyContent_ReturnsBadRequest()
    {
        SetUser(Guid.NewGuid(), "Admin");

        var result = await _controller.AdminSendMessage(Guid.NewGuid(), new SendMessageRequest { Content = "" });

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("Message content cannot be empty", badRequest.Value);
    }

    [Fact]
    public async Task AdminSendMessage_WhenConversationNotFound_ReturnsNotFound()
    {
        SetUser(Guid.NewGuid(), "Admin");
        var conversationId = Guid.NewGuid();
        _chatRepositoryMock
            .Setup(x => x.GetConversationByIdAsync(conversationId))
            .ReturnsAsync((ChatConversation?)null);

        var result = await _controller.AdminSendMessage(conversationId, new SendMessageRequest { Content = "hello" });

        var notFound = Assert.IsType<NotFoundObjectResult>(result.Result);
        Assert.Equal("Conversation not found", notFound.Value);
    }

    private void SetUser(Guid userId, string role)
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
