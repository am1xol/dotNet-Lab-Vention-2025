using Microsoft.AspNetCore.Mvc;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Models;
using SubscriptionManager.Core.Models.Requests;
using SubscriptionManager.Core.Models.Responses;
using SubscriptionManager.Infrastructure.Services;

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

    public AuthController(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IVerificationCodeService verificationCodeService,
        IEmailService emailService,
        ITokenService tokenService)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _verificationCodeService = verificationCodeService;
        _emailService = emailService;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResult), 200)]
    [ProducesResponseType(typeof(AuthResult), 400)]
    [ProducesResponseType(typeof(AuthResult), 409)]
    public async Task<ActionResult<AuthResult>> Register([FromBody] RegisterRequest request)
    {
        var result = new AuthResult();

        if (!ModelState.IsValid)
        {
            result.Success = false;
            result.Errors.AddRange(ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage));
            return BadRequest(result);
        }

        if (await _userRepository.ExistsByEmailAsync(request.Email))
        {
            result.Success = false;
            result.Errors.Add("Email already exists");
            return Conflict(result);
        }

        var verificationCode = _verificationCodeService.GenerateCode();
        var codeExpiresAt = _verificationCodeService.GetExpirationTime();

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
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _userRepository.AddAsync(user);
        await _userRepository.SaveChangesAsync();

        try
        {
            await _emailService.SendVerificationEmailAsync(user.Email, verificationCode, user.FirstName);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to send verification email: {ex.Message}");
        }

        result.Success = true;
        result.UserId = user.Id.ToString();
        return Ok(result);
    }

    [HttpPost("verify-email")]
    [ProducesResponseType(typeof(AuthResult), 200)]
    [ProducesResponseType(typeof(AuthResult), 400)]
    [ProducesResponseType(typeof(AuthResult), 404)]
    public async Task<ActionResult<AuthResult>> VerifyEmail([FromBody] VerifyEmailRequest request)
    {
        var result = new AuthResult();

        if (!ModelState.IsValid)
        {
            result.Success = false;
            result.Errors.AddRange(ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage));
            return BadRequest(result);
        }

        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null)
        {
            result.Success = false;
            result.Errors.Add("User not found");
            return NotFound(result);
        }

        if (user.IsEmailVerified)
        {
            result.Success = false;
            result.Errors.Add("Email is already verified");
            return BadRequest(result);
        }

        if (user.EmailVerificationCode != request.VerificationCode)
        {
            result.Success = false;
            result.Errors.Add("Invalid verification code");
            return BadRequest(result);
        }

        if (user.EmailVerificationCodeExpiresAt < DateTime.UtcNow)
        {
            result.Success = false;
            result.Errors.Add("Verification code has expired");
            return BadRequest(result);
        }

        user.IsEmailVerified = true;
        user.EmailVerificationCode = null;
        user.EmailVerificationCodeExpiresAt = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.SaveChangesAsync();

        result.Success = true;
        result.UserId = user.Id.ToString();
        return Ok(result);
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), 200)]
    [ProducesResponseType(typeof(LoginResponse), 400)]
    [ProducesResponseType(typeof(LoginResponse), 401)]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        var response = new LoginResponse();

        if (!ModelState.IsValid)
        {
            response.Success = false;
            response.Errors.AddRange(ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage));
            return BadRequest(response);
        }

        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null)
        {
            response.Success = false;
            response.Errors.Add("Invalid email or password");
            return Unauthorized(response);
        }

        if (!user.IsEmailVerified)
        {
            response.Success = false;
            response.Errors.Add("Please verify your email before logging in");
            return Unauthorized(response);
        }

        if (!_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            response.Success = false;
            response.Errors.Add("Invalid email or password");
            return Unauthorized(response);
        }

        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();
        var accessTokenExpiresAt = DateTime.UtcNow.AddMinutes(10);

        response.Success = true;
        response.AccessToken = accessToken;
        response.RefreshToken = refreshToken;
        response.AccessTokenExpiresAt = accessTokenExpiresAt;

        return Ok(response);
    }
}