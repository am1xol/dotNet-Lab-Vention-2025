using DeviceDetectorNET;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using SubscriptionManager.Core.Constants;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Models;
using SubscriptionManager.Core.Models.Requests;
using SubscriptionManager.Core.Models.Responses;

namespace SubscriptionManager.Auth.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IVerificationCodeService _verificationCodeService;
    private readonly IEmailService _emailService;
    private readonly ITokenService _tokenService;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly ILogger<AuthService> _logger;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuthService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IVerificationCodeService verificationCodeService,
        IEmailService emailService,
        ITokenService tokenService,
        IRefreshTokenRepository refreshTokenRepository,
        ILogger<AuthService> logger,
        IHttpContextAccessor httpContextAccessor)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _verificationCodeService = verificationCodeService;
        _emailService = emailService;
        _tokenService = tokenService;
        _refreshTokenRepository = refreshTokenRepository;
        _logger = logger;
        _httpContextAccessor = httpContextAccessor;
    }

    private string GetDeviceDescription()
    {
        var userAgent = _httpContextAccessor.HttpContext?.Request.Headers["User-Agent"].ToString();
        if (string.IsNullOrEmpty(userAgent)) return "Unknown Device";

        var dd = new DeviceDetector(userAgent);
        dd.Parse();

        if (dd.IsBot()) return "Bot/Crawler";

        var clientInfo = dd.GetClient();
        var osInfo = dd.GetOs();
        var deviceName = dd.GetModel();

        return $"{clientInfo.Match.Name} on {osInfo.Match.Name} {osInfo.Match.Version} {deviceName}".Trim();
    }

    public async Task<AuthResult> RegisterAsync(RegisterRequest request)
    {
        if (await _userRepository.ExistsByEmailAsync(request.Email))
        {
            return new AuthResult { Success = false, Error = "Email already exists" };
        }

        if (!string.IsNullOrEmpty(request.Role) &&
            request.Role != RoleConstants.User &&
            request.Role != RoleConstants.Admin)
        {
            return new AuthResult { Success = false, Error = $"Invalid role. Allowed values: '{RoleConstants.User}' or '{RoleConstants.Admin}'" };
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
            Role = request.Role ?? RoleConstants.DefaultRole,
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
        catch
        {

        }

        return new AuthResult { Success = true, UserId = user.Id.ToString() };
    }

    public async Task<AuthResult> VerifyEmailAsync(VerifyEmailRequest request)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null)
        {
            return new AuthResult { Success = false, Error = "User not found" };
        }

        if (user.IsEmailVerified)
        {
            return new AuthResult { Success = false, Error = "Email is already verified" };
        }

        if (user.EmailVerificationCode != request.VerificationCode)
        {
            return new AuthResult { Success = false, Error = "Invalid verification code" };
        }

        var now = DateTime.UtcNow;
        if (user.EmailVerificationCodeExpiresAt < now)
        {
            return new AuthResult { Success = false, Error = "Verification code has expired" };
        }

        user.IsEmailVerified = true;
        user.EmailVerificationCode = null;
        user.EmailVerificationCodeExpiresAt = null;
        user.UpdatedAt = now;

        await _userRepository.SaveChangesAsync();

        return new AuthResult { Success = true, UserId = user.Id.ToString() };
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
        {
            return new LoginResponse { Success = false, Error = "Email and password are required" };
        }

        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null)
        {
            return new LoginResponse { Success = false, Error = "Invalid email or password" };
        }

        if (!user.IsEmailVerified)
        {
            return new LoginResponse { Success = false, Error = "Please verify your email before logging in" };
        }

        if (!_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            return new LoginResponse { Success = false, Error = "Invalid email or password" };
        }

        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();
        var now = DateTime.UtcNow;

        var refreshTokenEntity = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = refreshToken,
            DeviceName = GetDeviceDescription(),
            ExpiresAt = _tokenService.GetRefreshTokenExpiration(),
            CreatedAt = now,
            IsRevoked = false
        };

        await _refreshTokenRepository.AddAsync(refreshTokenEntity);
        await _refreshTokenRepository.SaveChangesAsync();

        return new LoginResponse
        {
            Success = true,
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            AccessTokenExpiresAt = now.AddMinutes(10)
        };
    }

    public async Task<RefreshTokenResponse> RefreshTokenAsync(RefreshTokenRequest request)
    {
        var refreshTokenEntity = await _refreshTokenRepository.GetByTokenAsync(request.RefreshToken);
        if (refreshTokenEntity == null)
        {
            return new RefreshTokenResponse { Success = false, Error = "Invalid refresh token" };
        }

        var now = DateTime.UtcNow;
        if (refreshTokenEntity.ExpiresAt < now)
        {
            return new RefreshTokenResponse { Success = false, Error = "Refresh token has expired" };
        }

        if (refreshTokenEntity.IsRevoked)
        {
            return new RefreshTokenResponse { Success = false, Error = "Refresh token has been revoked" };
        }

        var user = refreshTokenEntity.User;
        var newAccessToken = _tokenService.GenerateAccessToken(user);
        var newRefreshToken = _tokenService.GenerateRefreshToken();

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

        return new RefreshTokenResponse
        {
            Success = true,
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            AccessTokenExpiresAt = now.AddMinutes(10)
        };
    }

    public async Task<ForgotPasswordResponse> ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null)
        {
            return new ForgotPasswordResponse { Success = true, Message = "If the email exists, a reset code has been sent." };
        }

        var resetCode = new Random().Next(100000, 999999).ToString();
        var expiresAt = DateTime.UtcNow.AddHours(1);

        user.PasswordResetToken = resetCode;
        user.PasswordResetCode = resetCode;
        user.PasswordResetExpiresAt = expiresAt;
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.SaveChangesAsync();

        try
        {
            await _emailService.SendPasswordResetEmailAsync(user.Email, resetCode, user.FirstName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send password reset email to {Email}", user.Email);
        }

        return new ForgotPasswordResponse { Success = true, Message = "If the email exists, a reset code has been sent." };
    }

    public async Task<ForgotPasswordResponse> ResetPasswordAsync(ResetPasswordRequest request)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null)
        {
            return new ForgotPasswordResponse { Success = false, Error = "Invalid reset token" };
        }

        if (user.PasswordResetCode != request.ResetToken ||
            user.PasswordResetExpiresAt < DateTime.UtcNow)
        {
            return new ForgotPasswordResponse { Success = false, Error = "Invalid or expired reset code" };
        }

        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetCode = null;
        user.PasswordResetExpiresAt = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.SaveChangesAsync();

        return new ForgotPasswordResponse { Success = true, Message = "Password has been reset successfully" };
    }

    private const int RESEND_COOLDOWN_SECONDS = 60;

    public async Task<AuthResult> ResendVerificationCodeAsync(ResendVerificationCodeRequest request)
    {
        if (string.IsNullOrEmpty(request.Email))
        {
            return new AuthResult { Success = false, Error = "Email is required." };
        }

        var user = await _userRepository.GetByEmailAsync(request.Email!);

        if (user == null)
        {
            _logger.LogWarning("Attempt to resend code for non-existent email: {Email}", request.Email);
            return new AuthResult { Success = true, UserId = null };
        }

        if (user.IsEmailVerified)
        {
            return new AuthResult { Success = false, Error = "Email is already verified." };
        }

        if (user.UpdatedAt.AddSeconds(RESEND_COOLDOWN_SECONDS) > DateTime.UtcNow)
        {
            var waitTime = user.UpdatedAt.AddSeconds(RESEND_COOLDOWN_SECONDS).Subtract(DateTime.UtcNow);
            return new AuthResult { Success = false, Error = $"You must wait {Math.Ceiling(waitTime.TotalSeconds)} seconds before trying again." };
        }

        var newVerificationCode = _verificationCodeService.GenerateCode();
        var newCodeExpiresAt = _verificationCodeService.GetExpirationTime();
        var now = DateTime.UtcNow;

        user.EmailVerificationCode = newVerificationCode;
        user.EmailVerificationCodeExpiresAt = newCodeExpiresAt;
        user.UpdatedAt = now;

        await _userRepository.SaveChangesAsync();

        try
        {
            await _emailService.SendVerificationEmailAsync(user.Email, newVerificationCode, user.FirstName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send verification email during resend for user {UserId}", user.Id);
        }

        return new AuthResult { Success = true, UserId = user.Id.ToString() };
    }
}