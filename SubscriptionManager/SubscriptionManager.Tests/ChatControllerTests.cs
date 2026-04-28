using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using SubscriptionManager.Auth.API.Controllers;
using SubscriptionManager.Auth.API.Realtime;
using SubscriptionManager.Auth.API.Services;
using SubscriptionManager.Core.DTOs;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Models;
using System.Security.Claims;

namespace SubscriptionManager.Tests;

public class ChatControllerTests
{
    private readonly Mock<IChatRepository> _chatRepositoryMock = new();
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<IProfanityFilter> _profanityFilterMock = new();
    private readonly Mock<IAdminSupportNotificationQueue> _notificationQueueMock = new();
    private readonly Mock<IHubContext<ChatHub>> _hubContextMock = new();
    private readonly Mock<IHubClients> _hubClientsMock = new();
    private readonly Mock<IGroupManager> _groupManagerMock = new();
    private readonly Mock<IClientProxy> _clientProxyMock = new();
    private readonly ChatController _controller;

    public ChatControllerTests()
    {
        var logger = new Mock<ILogger<ChatController>>();
        _profanityFilterMock
            .Setup(x => x.ModerateText(It.IsAny<string>()))
            .Returns<string>(x => x);
        _hubClientsMock.Setup(x => x.Group(It.IsAny<string>())).Returns(_clientProxyMock.Object);
        _clientProxyMock
            .Setup(x => x.SendCoreAsync(It.IsAny<string>(), It.IsAny<object?[]>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _hubContextMock.SetupGet(x => x.Clients).Returns(_hubClientsMock.Object);
        _hubContextMock.SetupGet(x => x.Groups).Returns(_groupManagerMock.Object);

        _controller = new ChatController(
            _chatRepositoryMock.Object,
            _profanityFilterMock.Object,
            _notificationQueueMock.Object,
            _hubContextMock.Object,
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
            .Setup(x => x.GetConversationByUserIdAsync(userId))
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

    [Fact]
    public async Task GetMyConversation_WithoutUserClaim_ReturnsUnauthorized()
    {
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity())
            }
        };

        var result = await _controller.GetMyConversation();

        Assert.IsType<UnauthorizedResult>(result.Result);
    }

    [Fact]
    public async Task SendMessage_WithoutUserClaim_ReturnsUnauthorized()
    {
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity())
            }
        };

        var result = await _controller.SendMessage(new SendMessageRequest { Content = "Hi" });

        Assert.IsType<UnauthorizedResult>(result.Result);
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
