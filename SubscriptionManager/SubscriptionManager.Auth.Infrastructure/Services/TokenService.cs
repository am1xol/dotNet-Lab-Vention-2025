using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SubscriptionManager.Core;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Models;
using SubscriptionManager.Core.Options;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace SubscriptionManager.Auth.Infrastructure.Services;

public class TokenService : ITokenService
{
    private readonly JwtOptions _jwtOptions;
    private readonly TimeProvider _timeProvider;

    public TokenService(IOptions<JwtOptions> jwtOptions, TimeProvider timeProvider)
    {
        _jwtOptions = jwtOptions.Value;
        _timeProvider = timeProvider;
    }

    public string GenerateAccessToken(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.GivenName, user.FirstName),
            new Claim(ClaimTypes.Surname, user.LastName),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim(ClaimTypesConstants.IsVerified, user.IsEmailVerified.ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.Secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var utcNow = _timeProvider.GetUtcNow().UtcDateTime;

        var token = new JwtSecurityToken(
            issuer: _jwtOptions.Issuer,
            audience: _jwtOptions.Audience,
            claims: claims,
            notBefore: utcNow,
            expires: utcNow.AddMinutes(_jwtOptions.AccessTokenExpirationMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    public DateTime GetRefreshTokenExpiration()
    {
        return _timeProvider.GetUtcNow().UtcDateTime.AddDays(_jwtOptions.RefreshTokenExpirationDays);
    }
}