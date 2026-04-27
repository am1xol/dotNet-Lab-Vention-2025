using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using SubscriptionManager.API.Controllers;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Models.Requests;
using SubscriptionManager.Core.Models.Responses;

namespace SubscriptionManager.Tests;

public class AuthControllerTests
{
    private readonly Mock<IAuthService> _authServiceMock = new();
    private readonly AuthController _controller;

    public AuthControllerTests()
    {
        var logger = new Mock<ILogger<AuthController>>();
        _controller = new AuthController(_authServiceMock.Object, logger.Object);
    }

    [Fact]
    public async Task Register_WithoutAcceptedTerms_ReturnsBadRequestProblem()
    {
        var request = new RegisterRequest
        {
            Email = "user@example.com",
            Password = "StrongPass123",
            AcceptTerms = false,
            FirstName = "John",
            LastName = "Doe"
        };

        var result = await _controller.Register(request);

        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status400BadRequest, objectResult.StatusCode);
        _authServiceMock.Verify(x => x.RegisterAsync(It.IsAny<RegisterRequest>()), Times.Never);
    }

    [Fact]
    public async Task Register_WithInvalidEmail_ReturnsBadRequestProblem()
    {
        var request = new RegisterRequest
        {
            Email = "invalid-email",
            Password = "StrongPass123",
            AcceptTerms = true,
            FirstName = "John",
            LastName = "Doe"
        };

        var result = await _controller.Register(request);

        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status400BadRequest, objectResult.StatusCode);
        _authServiceMock.Verify(x => x.RegisterAsync(It.IsAny<RegisterRequest>()), Times.Never);
    }

    [Fact]
    public async Task Register_WhenEmailAlreadyExists_ReturnsConflict()
    {
        var request = new RegisterRequest
        {
            Email = "user@example.com",
            Password = "StrongPass123",
            AcceptTerms = true,
            FirstName = "John",
            LastName = "Doe"
        };
        _authServiceMock
            .Setup(x => x.RegisterAsync(request))
            .ReturnsAsync(new AuthResult { Error = "Email already exists" });

        var result = await _controller.Register(request);

        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status409Conflict, objectResult.StatusCode);
    }

    [Fact]
    public async Task Login_WithMissingCredentials_ReturnsBadRequestProblem()
    {
        var request = new LoginRequest
        {
            Email = string.Empty,
            Password = string.Empty
        };

        var result = await _controller.Login(request);

        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status400BadRequest, objectResult.StatusCode);
        _authServiceMock.Verify(x => x.LoginAsync(It.IsAny<LoginRequest>()), Times.Never);
    }

    [Fact]
    public async Task Login_WithInvalidEmailFormat_ReturnsBadRequestProblem()
    {
        var request = new LoginRequest
        {
            Email = "invalid-email",
            Password = "some-password"
        };

        var result = await _controller.Login(request);

        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status400BadRequest, objectResult.StatusCode);
        _authServiceMock.Verify(x => x.LoginAsync(It.IsAny<LoginRequest>()), Times.Never);
    }

    [Fact]
    public async Task Login_WhenAuthServiceReturnsError_ReturnsUnauthorized()
    {
        var request = new LoginRequest
        {
            Email = "user@example.com",
            Password = "StrongPass123"
        };
        _authServiceMock
            .Setup(x => x.LoginAsync(request))
            .ReturnsAsync(new LoginResponse { Error = "Invalid credentials" });

        var result = await _controller.Login(request);

        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status401Unauthorized, objectResult.StatusCode);
    }

    [Fact]
    public async Task Refresh_WhenAuthServiceReturnsError_ReturnsUnauthorized()
    {
        var request = new RefreshTokenRequest { RefreshToken = "expired-token" };
        _authServiceMock
            .Setup(x => x.RefreshTokenAsync(request))
            .ReturnsAsync(new RefreshTokenResponse { Error = "Refresh token expired" });

        var result = await _controller.Refresh(request);

        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status401Unauthorized, objectResult.StatusCode);
    }

    [Fact]
    public async Task Refresh_WithValidRequest_ReturnsOk()
    {
        var request = new RefreshTokenRequest { RefreshToken = "valid-token" };
        _authServiceMock
            .Setup(x => x.RefreshTokenAsync(request))
            .ReturnsAsync(new RefreshTokenResponse
            {
                AccessToken = "new-access-token",
                RefreshToken = "new-refresh-token"
            });

        var result = await _controller.Refresh(request);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<RefreshTokenResponse>(okResult.Value);
        Assert.Equal("new-access-token", response.AccessToken);
    }

    [Fact]
    public async Task ResendVerificationCode_WithInvalidModelState_ReturnsBadRequestWithError()
    {
        _controller.ModelState.AddModelError("Email", "The Email field is required.");

        var request = new ResendVerificationCodeRequest { Email = null };
        var result = await _controller.ResendVerificationCode(request);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        var payload = Assert.IsType<AuthResult>(badRequest.Value);
        Assert.Equal("Invalid request data. Check email format.", payload.Error);
        _authServiceMock.Verify(x => x.ResendVerificationCodeAsync(It.IsAny<ResendVerificationCodeRequest>()), Times.Never);
    }

    [Fact]
    public async Task ResendVerificationCode_WhenServiceReturnsError_ReturnsBadRequest()
    {
        var request = new ResendVerificationCodeRequest { Email = "user@example.com" };
        _authServiceMock
            .Setup(x => x.ResendVerificationCodeAsync(request))
            .ReturnsAsync(new AuthResult { Error = "Too many attempts" });

        var result = await _controller.ResendVerificationCode(request);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        var payload = Assert.IsType<AuthResult>(badRequest.Value);
        Assert.Equal("Too many attempts", payload.Error);
    }

    [Fact]
    public async Task ResendVerificationCode_WithValidRequest_ReturnsOk()
    {
        var request = new ResendVerificationCodeRequest { Email = "user@example.com" };
        _authServiceMock
            .Setup(x => x.ResendVerificationCodeAsync(request))
            .ReturnsAsync(new AuthResult { UserId = Guid.NewGuid().ToString() });

        var result = await _controller.ResendVerificationCode(request);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.IsType<AuthResult>(okResult.Value);
    }
}
