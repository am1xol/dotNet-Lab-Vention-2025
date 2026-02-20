using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using SubscriptionManager.Auth.Infrastructure.Services;
using SubscriptionManager.Core.Models;
using SubscriptionManager.Core.Options;
using System.IdentityModel.Tokens.Jwt;

namespace SubscriptionManager.Tests
{
    public class TokenServiceTests
    {
        private readonly TokenService _tokenService;
        private readonly JwtOptions _jwtOptions;
        private readonly FakeTimeProvider _fakeTime;
        private readonly DateTimeOffset _fixedStartTime;

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

            _fixedStartTime = new DateTimeOffset(2026, 2, 20, 10, 0, 0, TimeSpan.Zero);
            _fakeTime = new FakeTimeProvider(_fixedStartTime);

            _tokenService = new TokenService(Options.Create(_jwtOptions), _fakeTime);
        }

        [Fact]
        public void GenerateAccessToken_ReturnsValidTokenWithCorrectExpiration()
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
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);

            var expectedExpiration = _fixedStartTime.UtcDateTime.AddMinutes(_jwtOptions.AccessTokenExpirationMinutes);

            Assert.Equal(expectedExpiration, jwtToken.ValidTo, TimeSpan.FromSeconds(1));
        }

        [Fact]
        public void GetRefreshTokenExpiration_ReturnsExactExpectedDate()
        {
            var expiration = _tokenService.GetRefreshTokenExpiration();

            var expectedExpiration = _fixedStartTime.UtcDateTime.AddDays(_jwtOptions.RefreshTokenExpirationDays);

            Assert.Equal(expectedExpiration, expiration);
        }

        [Fact]
        public void GenerateRefreshToken_ReturnsUniqueTokens()
        {
            var token1 = _tokenService.GenerateRefreshToken();
            var token2 = _tokenService.GenerateRefreshToken();

            Assert.NotEqual(token1, token2);
        }
    }
}