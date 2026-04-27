using DeviceDetectorNET;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SubscriptionManager.Core.Constants;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Models;
using SubscriptionManager.Core.Models.Requests;
using SubscriptionManager.Core.Models.Responses;
using SubscriptionManager.Core.Options;

namespace SubscriptionManager.Auth.Infrastructure.Services;

public class AuthService : IAuthService
{
    private static readonly string[] ReservedAdminMarkers = ["admin", "админ", "adminuser", "админпользователь", "Admin", "Админ", "AdminUser", "Админпользователь"];

    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IVerificationCodeService _verificationCodeService;
    private readonly IEmailService _emailService;
    private readonly ITokenService _tokenService;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly ILogger<AuthService> _logger;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IAuthAttemptProtectionService _attemptProtectionService;
    private readonly AuthSecurityOptions _authSecurityOptions;

    public AuthService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IVerificationCodeService verificationCodeService,
        IEmailService emailService,
        ITokenService tokenService,
        IRefreshTokenRepository refreshTokenRepository,
        ILogger<AuthService> logger,
        IHttpContextAccessor httpContextAccessor,
        IAuthAttemptProtectionService attemptProtectionService,
        IOptions<AuthSecurityOptions> authSecurityOptions)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _verificationCodeService = verificationCodeService;
        _emailService = emailService;
        _tokenService = tokenService;
        _refreshTokenRepository = refreshTokenRepository;
        _logger = logger;
        _httpContextAccessor = httpContextAccessor;
        _attemptProtectionService = attemptProtectionService;
        _authSecurityOptions = authSecurityOptions.Value;
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
        if (ContainsReservedAdminMarker(request.FirstName, request.LastName, request.Email))
        {
            return new AuthResult { Error = "Registration with admin-related name, surname, or email is not allowed" };
        }

        if (await _userRepository.ExistsByEmailAsync(request.Email))
        {
            return new AuthResult { Error = "Email already exists" };
        }

        if (!string.IsNullOrEmpty(request.Role) &&
            request.Role != RoleConstants.User &&
            request.Role != RoleConstants.Admin)
        {
            return new AuthResult { Error = $"Invalid role. Allowed values: '{RoleConstants.User}' or '{RoleConstants.Admin}'" };
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Could not send verification email for user {UserId} after multiple retries.", user.Id);

            return new AuthResult
            {
                Error = "User registered, but we couldn't send the verification email. Please use 'Resend Code' option."
            };
        }

        return new AuthResult { UserId = user.Id.ToString() };
    }

    private static bool ContainsReservedAdminMarker(params string[] values)
    {
        foreach (var rawValue in values)
        {
            if (string.IsNullOrWhiteSpace(rawValue))
            {
                continue;
            }

            var normalized = rawValue.Trim().ToLowerInvariant();
            foreach (var marker in ReservedAdminMarkers)
            {
                if (normalized.Contains(marker, StringComparison.Ordinal))
                {
                    return true;
                }
            }
        }

        return false;
    }

    public async Task<AuthResult> VerifyEmailAsync(VerifyEmailRequest request)
    {
        if (TryGetActiveLockout("verify-email", request.Email, out var verifyRetryAfter))
        {
            return new AuthResult
            {
                Error = $"Too many attempts. Try again in {Math.Ceiling(verifyRetryAfter.TotalSeconds)} seconds."
            };
        }

        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null)
        {
            _attemptProtectionService.RegisterFailure("verify-email", request.Email, GetClientIpAddress(), _authSecurityOptions.VerificationMaxFailures);
            return new AuthResult { Error = "User not found" };
        }

        if (user.IsEmailVerified)
        {
            return new AuthResult { Error = "Email is already verified" };
        }

        if (user.EmailVerificationCode != request.VerificationCode)
        {
            _attemptProtectionService.RegisterFailure("verify-email", request.Email, GetClientIpAddress(), _authSecurityOptions.VerificationMaxFailures);
            return new AuthResult { Error = "Invalid verification code" };
        }

        var now = DateTime.UtcNow;
        if (user.EmailVerificationCodeExpiresAt < now)
        {
            _attemptProtectionService.RegisterFailure("verify-email", request.Email, GetClientIpAddress(), _authSecurityOptions.VerificationMaxFailures);
            return new AuthResult { Error = "Verification code has expired" };
        }

        await _userRepository.VerifyEmailAsync(user.Id);
        _attemptProtectionService.RegisterSuccess("verify-email", request.Email, GetClientIpAddress());

        return new AuthResult { UserId = user.Id.ToString() };
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        if (TryGetActiveLockout("login", request.Email, out var loginRetryAfter))
        {
            return new LoginResponse
            {
                Error = $"Too many login attempts. Try again in {Math.Ceiling(loginRetryAfter.TotalSeconds)} seconds."
            };
        }

        if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
        {
            return new LoginResponse { Error = "Email and password are required" };
        }

        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null)
        {
            _attemptProtectionService.RegisterFailure("login", request.Email, GetClientIpAddress(), _authSecurityOptions.LoginMaxFailures);
            return new LoginResponse { Error = "Invalid email or password" };
        }

        if (!user.IsEmailVerified)
        {
            return new LoginResponse { Error = "Please verify your email before logging in" };
        }

        if (!_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            _attemptProtectionService.RegisterFailure("login", request.Email, GetClientIpAddress(), _authSecurityOptions.LoginMaxFailures);
            return new LoginResponse { Error = "Invalid email or password" };
        }

        if (user.IsBlocked)
        {
            _attemptProtectionService.RegisterFailure("login", request.Email, GetClientIpAddress(), _authSecurityOptions.LoginMaxFailures);
            return new LoginResponse { Error = "Your account has been blocked." };
        }

        _attemptProtectionService.RegisterSuccess("login", request.Email, GetClientIpAddress());

        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();
        var now = DateTime.UtcNow;
        var refreshTokenExpiration = _tokenService.GetRefreshTokenExpiration();

        _logger.LogInformation("Creating refresh token - UserId: {UserId}, Now: {Now}, GetRefreshTokenExpiration: {Expiration}, RefreshTokenExpirationDays config: {ConfigDays}", 
            user.Id, now, refreshTokenExpiration, _tokenService.GetRefreshTokenExpirationDays());

        var refreshTokenEntity = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = refreshToken,
            DeviceName = GetDeviceDescription(),
            ExpiresAt = refreshTokenExpiration,
            CreatedAt = now,
            IsRevoked = false
        };

        _logger.LogInformation("RefreshTokenEntity before save - ExpiresAt: {ExpiresAt}, CreatedAt: {CreatedAt}", 
            refreshTokenEntity.ExpiresAt, refreshTokenEntity.CreatedAt);

        await _refreshTokenRepository.AddAsync(refreshTokenEntity);
        await _refreshTokenRepository.SaveChangesAsync();

        _logger.LogInformation("Refresh token saved successfully - Token: {Token}, ExpiresAt: {ExpiresAt}", 
            refreshToken, refreshTokenEntity.ExpiresAt);

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            AccessTokenExpiresAt = now.AddMinutes(10)
        };
    }

    public async Task<RefreshTokenResponse> RefreshTokenAsync(RefreshTokenRequest request)
    {
        try
        {
            _logger.LogInformation("RefreshTokenAsync - Starting refresh for token: {Token}", request.RefreshToken);
            
            var refreshTokenEntity = await _refreshTokenRepository.GetByTokenAsync(request.RefreshToken);
            
            _logger.LogInformation("RefreshTokenAsync - GetByTokenAsync returned: {Found}", refreshTokenEntity != null);
            
            if (refreshTokenEntity == null)
            {
                _logger.LogWarning("RefreshTokenAsync - Token not found in database");
                return new RefreshTokenResponse { Error = "Invalid refresh token" };
            }

            var now = DateTime.UtcNow;
            
            var expiresAtUtc = refreshTokenEntity.ExpiresAt.Kind == DateTimeKind.Unspecified 
                ? DateTime.SpecifyKind(refreshTokenEntity.ExpiresAt, DateTimeKind.Utc)
                : refreshTokenEntity.ExpiresAt.ToUniversalTime();
            
            _logger.LogInformation("Token check - Now (UTC): {Now}, ExpiresAt (UTC): {ExpiresAt}, ExpiresAt Kind: {Kind}, IsExpired: {IsExpired}", 
                now, expiresAtUtc, expiresAtUtc.Kind, expiresAtUtc < now);
            
            if (expiresAtUtc < now)
            {
                _logger.LogWarning("RefreshTokenAsync - Token expired. ExpiresAt: {ExpiresAt}, Now: {Now}", expiresAtUtc, now);
                return new RefreshTokenResponse { Error = "Refresh token has expired" };
            }

            if (refreshTokenEntity.IsRevoked)
            {
                _logger.LogWarning("RefreshTokenAsync - Token is revoked");
                return new RefreshTokenResponse { Error = "Refresh token has been revoked" };
            }

            var user = refreshTokenEntity.User;

            if (user == null)
            {
                user = await _userRepository.GetByIdAsync(refreshTokenEntity.UserId)
                       ?? throw new InvalidOperationException("User not found for refresh token");
            }

            if (user.IsBlocked)
            {
                return new RefreshTokenResponse { Error = "Your account has been blocked." };
            }

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

            _logger.LogInformation("RefreshTokenAsync - Token refreshed successfully for user {UserId}", user.Id);

            return new RefreshTokenResponse
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken,
                AccessTokenExpiresAt = now.AddMinutes(10)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while refreshing token");
            return new RefreshTokenResponse
            {
                Error = "Failed to refresh token"
            };
        }
    }

    public async Task<ForgotPasswordResponse> ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        if (TryGetActiveLockout("forgot-password", request.Email, out var forgotRetryAfter))
        {
            return new ForgotPasswordResponse
            {
                Error = $"Too many requests. Try again in {Math.Ceiling(forgotRetryAfter.TotalSeconds)} seconds."
            };
        }

        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null)
        {
            _attemptProtectionService.RegisterFailure("forgot-password", request.Email, GetClientIpAddress(), _authSecurityOptions.PasswordResetMaxFailures);
            return new ForgotPasswordResponse { Message = "If the email exists, a reset code has been sent." };
        }

        var resetCode = new Random().Next(100000, 999999).ToString();
        var expiresAt = DateTime.UtcNow.AddHours(1);

        await _userRepository.UpdateResetCodeAsync(user.Id, resetCode, expiresAt);

        try
        {
            await _emailService.SendPasswordResetEmailAsync(user.Email, resetCode, user.FirstName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send password reset email to {Email} after retries", user.Email);
            _attemptProtectionService.RegisterFailure("forgot-password", request.Email, GetClientIpAddress(), _authSecurityOptions.PasswordResetMaxFailures);

            return new ForgotPasswordResponse
            {
                Error = "We encountered a technical issue sending the reset code. Please try again later."
            };
        }

        _attemptProtectionService.RegisterSuccess("forgot-password", request.Email, GetClientIpAddress());
        return new ForgotPasswordResponse { Message = "If the email exists, a reset code has been sent." };
    }

    public async Task<ForgotPasswordResponse> ResetPasswordAsync(ResetPasswordRequest request)
    {
        if (TryGetActiveLockout("reset-password", request.Email, out var resetRetryAfter))
        {
            return new ForgotPasswordResponse
            {
                Error = $"Too many reset attempts. Try again in {Math.Ceiling(resetRetryAfter.TotalSeconds)} seconds."
            };
        }

        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null)
        {
            _attemptProtectionService.RegisterFailure("reset-password", request.Email, GetClientIpAddress(), _authSecurityOptions.PasswordResetMaxFailures);
            return new ForgotPasswordResponse { Error = "Invalid reset token" };
        }

        if (user.PasswordResetCode != request.ResetToken ||
            user.PasswordResetExpiresAt < DateTime.UtcNow)
        {
            _attemptProtectionService.RegisterFailure("reset-password", request.Email, GetClientIpAddress(), _authSecurityOptions.PasswordResetMaxFailures);
            return new ForgotPasswordResponse { Error = "Invalid or expired reset code" };
        }

        var newPasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        await _userRepository.UpdatePasswordAsync(user.Id, newPasswordHash);
        _attemptProtectionService.RegisterSuccess("reset-password", request.Email, GetClientIpAddress());

        return new ForgotPasswordResponse { Message = "Password has been reset successfully" };
    }

    private const int RESEND_COOLDOWN_SECONDS = 60;

    public async Task<AuthResult> ResendVerificationCodeAsync(ResendVerificationCodeRequest request)
    {
        if (TryGetActiveLockout("resend-verification", request.Email, out var resendRetryAfter))
        {
            return new AuthResult
            {
                Error = $"Too many requests. Try again in {Math.Ceiling(resendRetryAfter.TotalSeconds)} seconds."
            };
        }

        if (string.IsNullOrEmpty(request.Email))
        {
            return new AuthResult { Error = "Email is required." };
        }

        var user = await _userRepository.GetByEmailAsync(request.Email!);

        if (user == null)
        {
            _logger.LogWarning("Attempt to resend code for non-existent email: {Email}", request.Email);
            _attemptProtectionService.RegisterFailure("resend-verification", request.Email, GetClientIpAddress(), _authSecurityOptions.VerificationMaxFailures);
            return new AuthResult { UserId = null };
        }

        if (user.IsEmailVerified)
        {
            return new AuthResult { Error = "Email is already verified." };
        }

        if (user.UpdatedAt.AddSeconds(RESEND_COOLDOWN_SECONDS) > DateTime.UtcNow)
        {
            var waitTime = user.UpdatedAt.AddSeconds(RESEND_COOLDOWN_SECONDS).Subtract(DateTime.UtcNow);
            return new AuthResult { Error = $"You must wait {Math.Ceiling(waitTime.TotalSeconds)} seconds before trying again." };
        }

        var newVerificationCode = _verificationCodeService.GenerateCode();
        var newCodeExpiresAt = _verificationCodeService.GetExpirationTime();
        var now = DateTime.UtcNow;

        user.EmailVerificationCode = newVerificationCode;
        user.EmailVerificationCodeExpiresAt = newCodeExpiresAt;
        user.UpdatedAt = now;

        await _userRepository.UpdateEmailVerificationCodeAsync(
            user.Id,
            newVerificationCode,
            newCodeExpiresAt,
            now);

        try
        {
            await _emailService.SendVerificationEmailAsync(user.Email, newVerificationCode, user.FirstName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send verification email during resend for user {UserId}", user.Id);
            _attemptProtectionService.RegisterFailure("resend-verification", request.Email, GetClientIpAddress(), _authSecurityOptions.VerificationMaxFailures);

            return new AuthResult
            {
                Error = "Failed to send verification code. Please try again in a minute."
            };
        }

        _attemptProtectionService.RegisterSuccess("resend-verification", request.Email, GetClientIpAddress());
        return new AuthResult { UserId = user.Id.ToString() };
    }

    private string GetClientIpAddress()
    {
        return _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? "unknown-ip";
    }

    private bool TryGetActiveLockout(string action, string? accountKey, out TimeSpan retryAfter)
    {
        return _attemptProtectionService.IsLocked(action, accountKey, GetClientIpAddress(), out retryAfter);
    }
}