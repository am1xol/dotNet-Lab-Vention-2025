using Microsoft.Extensions.Options;
using SubscriptionManager.Core.Models;
using SubscriptionManager.Core.Options;
using SubscriptionManager.Auth.Infrastructure.Services;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace SubscriptionManager.Tests
{
    public class TokenServiceTests
    {
        private readonly TokenService _tokenService;
        private readonly JwtOptions _jwtOptions;

        public TokenServiceTests()
        {
            _jwtOptions = new JwtOptions
            {
                Secret = "super-secret-key-that-is-32-characters-long",
                Issuer = "test-issuer",
                Audience = "test-audience",
                AccessTokenExpirationMinutes = 60,
                RefreshTokenExpirationDays = 7
            };

            _tokenService = new TokenService(Options.Create(_jwtOptions));
        }

        [Fact]
        public void GenerateAccessToken_ReturnsValidToken()
        {
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@example.com",
                FirstName = "John",
                LastName = "Doe",
                Role = "User",
                IsEmailVerified = true
            };

            var token = _tokenService.GenerateAccessToken(user);

            Assert.NotNull(token);
            Assert.NotEmpty(token);

            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);

            Assert.Equal(_jwtOptions.Issuer, jwtToken.Issuer);
            Assert.Equal(_jwtOptions.Audience, jwtToken.Audiences.First());
            Assert.Contains(jwtToken.Claims, c => c.Type == ClaimTypes.Email && c.Value == user.Email);
            Assert.Contains(jwtToken.Claims, c => c.Type == "is_verified" && c.Value == "True");
        }

        [Fact]
        public void GenerateRefreshToken_ReturnsUniqueTokens()
        {
            var token1 = _tokenService.GenerateRefreshToken();
            var token2 = _tokenService.GenerateRefreshToken();

            Assert.NotNull(token1);
            Assert.NotNull(token2);
            Assert.NotEqual(token1, token2);
            Assert.NotEmpty(token1);
            Assert.NotEmpty(token2);
        }

        [Fact]
        public void GetRefreshTokenExpiration_ReturnsFutureDate()
        {
            var expiration = _tokenService.GetRefreshTokenExpiration();

            Assert.True(expiration > DateTime.UtcNow);
        }
    }
}
