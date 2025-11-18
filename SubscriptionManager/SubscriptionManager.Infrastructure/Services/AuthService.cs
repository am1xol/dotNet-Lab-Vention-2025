using Microsoft.Extensions.Logging;
using SubscriptionManager.Core.Constants;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Models;
using SubscriptionManager.Core.Models.Requests;
using SubscriptionManager.Core.Models.Responses;

namespace SubscriptionManager.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IVerificationCodeService _verificationCodeService;
    private readonly IEmailService _emailService;
    private readonly ITokenService _tokenService;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IVerificationCodeService verificationCodeService,
        IEmailService emailService,
        ITokenService tokenService,
        IRefreshTokenRepository refreshTokenRepository,
        ILogger<AuthService> logger)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _verificationCodeService = verificationCodeService;
        _emailService = emailService;
        _tokenService = tokenService;
        _refreshTokenRepository = refreshTokenRepository;
        _logger = logger;
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
            DeviceName = "Web Browser",
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
            // Для безопасности возвращаем успех даже если email не найден
            return new ForgotPasswordResponse { Success = true, Message = "If the email exists, a reset code has been sent." };
        }

        // Генерируем 6-значный код (используем тот же подход что и для верификации email)
        var resetCode = new Random().Next(100000, 999999).ToString();
        var expiresAt = DateTime.UtcNow.AddHours(1); // Код действует 1 час

        // Сохраняем в базу
        user.PasswordResetToken = resetCode; // Используем код как токен для простоты
        user.PasswordResetCode = resetCode;
        user.PasswordResetExpiresAt = expiresAt;
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.SaveChangesAsync();

        try
        {
            // Отправляем email с кодом
            await _emailService.SendPasswordResetEmailAsync(user.Email, resetCode, user.FirstName);
        }
        catch (Exception ex)
        {
            // Добавляем логгер в конструктор если его нет
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

        // Проверяем код и время
        if (user.PasswordResetCode != request.ResetToken ||
            user.PasswordResetExpiresAt < DateTime.UtcNow)
        {
            return new ForgotPasswordResponse { Success = false, Error = "Invalid or expired reset code" };
        }

        // Обновляем пароль
        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetCode = null;
        user.PasswordResetExpiresAt = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.SaveChangesAsync();

        return new ForgotPasswordResponse { Success = true, Message = "Password has been reset successfully" };
    }
}