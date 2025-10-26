using EmailValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Models;
using SubscriptionManager.Core.Models.Requests;
using SubscriptionManager.Core.Models.Responses;
using SubscriptionManager.Infrastructure.Repositories;
using SubscriptionManager.Infrastructure.Services;
using System.Security.Claims;

namespace SubscriptionManager.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IVerificationCodeService _verificationCodeService;
    private readonly IEmailService _emailService;
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _configuration;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IVerificationCodeService verificationCodeService,
        IEmailService emailService,
        ITokenService tokenService,
        IConfiguration configuration,
        IRefreshTokenRepository refreshTokenRepository,
        ILogger<AuthController> logger)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _verificationCodeService = verificationCodeService;
        _emailService = emailService;
        _tokenService = tokenService;
        _configuration = configuration;
        _refreshTokenRepository = refreshTokenRepository;
        _logger = logger;
    }

    [HttpPost("register")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthResult>> Register([FromBody] RegisterRequest request)
    {

        if (!EmailValidator.Validate(request.Email))
        {
            return Problem(
                title: "Invalid email format",
                statusCode: StatusCodes.Status400BadRequest);
        }

        if (await _userRepository.ExistsByEmailAsync(request.Email))
        {
            return Problem(
                title: "Email already exists",
                statusCode: StatusCodes.Status409Conflict);
        }

        var verificationCode = _verificationCodeService.GenerateCode();
        var codeExpiresAt = _verificationCodeService.GetExpirationTime();
        var now = DateTime.UtcNow;

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName,
            IsEmailVerified = false,
            EmailVerificationCode = verificationCode,
            EmailVerificationCodeExpiresAt = codeExpiresAt,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _userRepository.AddAsync(user);
        await _userRepository.SaveChangesAsync();

        try
        {
            await _emailService.SendVerificationEmailAsync(user.Email, verificationCode, user.FirstName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send verification email to {Email}", user.Email);
        }

        var result = new AuthResult
        {
            Success = true,
            UserId = user.Id.ToString()
        };
        return Ok(result);
    }

    [HttpPost("verify-email")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AuthResult>> VerifyEmail([FromBody] VerifyEmailRequest request)
    {

        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null)
        {
            return Problem(
                title: "User not found",
                statusCode: StatusCodes.Status404NotFound);
        }

        if (user.IsEmailVerified)
        {
            return Problem(
                title: "Email is already verified",
                statusCode: StatusCodes.Status400BadRequest);
        }

        if (user.EmailVerificationCode != request.VerificationCode)
        {
            return Problem(
                title: "Invalid verification code",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var now = DateTime.UtcNow;
        if (user.EmailVerificationCodeExpiresAt < now)
        {
            return Problem(
                title: "Verification code has expired",
                statusCode: StatusCodes.Status400BadRequest);
        }

        user.IsEmailVerified = true;
        user.EmailVerificationCode = null;
        user.EmailVerificationCodeExpiresAt = null;
        user.UpdatedAt = now;

        await _userRepository.SaveChangesAsync();

        var result = new AuthResult
        {
            Success = true,
            UserId = user.Id.ToString()
        };
        return Ok(result);
    }

    [HttpPost("login")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {

        if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
        {
            return Problem(
                title: "Email and password are required",
                statusCode: StatusCodes.Status400BadRequest);
        }

        if (!EmailValidator.Validate(request.Email))
        {
            return Problem(
                title: "Invalid email format",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null)
        {
            return Problem(
                title: "Invalid email or password",
                statusCode: StatusCodes.Status401Unauthorized);
        }

        if (!user.IsEmailVerified)
        {
            return Problem(
                title: "Please verify your email before logging in",
                statusCode: StatusCodes.Status401Unauthorized);
        }

        if (!_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            return Problem(
                title: "Invalid email or password",
                statusCode: StatusCodes.Status401Unauthorized);
        }

        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();
        var now = DateTime.UtcNow;
        var accessTokenExpiresAt = now.AddMinutes(10);

        var refreshTokenEntity = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = refreshToken,
            DeviceName = "Web Browser",
            ExpiresAt = _tokenService.GetRefreshTokenExpiration(),
            CreatedAt = now,
            IsRevoked = false
        };

        await _refreshTokenRepository.AddAsync(refreshTokenEntity);
        await _refreshTokenRepository.SaveChangesAsync();

        var response = new LoginResponse
        {
            Success = true,
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            AccessTokenExpiresAt = accessTokenExpiresAt
        };

        return Ok(response);
    }

    [HttpPost("refresh")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<RefreshTokenResponse>> Refresh([FromBody] RefreshTokenRequest request)
    {

        var refreshTokenEntity = await _refreshTokenRepository.GetByTokenAsync(request.RefreshToken);
        if (refreshTokenEntity == null)
        {
            return Problem(
                title: "Invalid refresh token",
                statusCode: StatusCodes.Status401Unauthorized);
        }

        var now = DateTime.UtcNow;
        if (refreshTokenEntity.ExpiresAt < now)
        {
            return Problem(
                title: "Refresh token has expired",
                statusCode: StatusCodes.Status401Unauthorized);
        }

        if (refreshTokenEntity.IsRevoked)
        {
            return Problem(
                title: "Refresh token has been revoked",
                statusCode: StatusCodes.Status401Unauthorized);
        }

        var user = refreshTokenEntity.User;
        var newAccessToken = _tokenService.GenerateAccessToken(user);
        var newRefreshToken = _tokenService.GenerateRefreshToken();
        var newAccessTokenExpiresAt = now.AddMinutes(10);

        refreshTokenEntity.IsRevoked = true;

        var newRefreshTokenEntity = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = newRefreshToken,
            DeviceName = refreshTokenEntity.DeviceName,
            ExpiresAt = _tokenService.GetRefreshTokenExpiration(),
            CreatedAt = now,
            IsRevoked = false
        };

        await _refreshTokenRepository.UpdateAsync(refreshTokenEntity);
        await _refreshTokenRepository.AddAsync(newRefreshTokenEntity);
        await _refreshTokenRepository.SaveChangesAsync();

        var response = new RefreshTokenResponse
        {
            Success = true,
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            AccessTokenExpiresAt = newAccessTokenExpiresAt
        };

        return Ok(response);
    }

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserDetailsResponse>> GetCurrentUser()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Problem(
                title: "Invalid token",
                statusCode: StatusCodes.Status401Unauthorized);
        }

        if (!Guid.TryParse(userIdClaim.Value, out var userId))
        {
            return Problem(
                title: "Invalid user ID in token",
                statusCode: StatusCodes.Status401Unauthorized);
        }

        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            return Problem(
                title: "User not found",
                statusCode: StatusCodes.Status401Unauthorized);
        }

        var response = new UserDetailsResponse
        {
            Id = user.Id.ToString(),
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            IsEmailVerified = user.IsEmailVerified,
            CreatedAt = user.CreatedAt
        };

        return Ok(response);
    }
}