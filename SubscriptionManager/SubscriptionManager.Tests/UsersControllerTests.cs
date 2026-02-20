using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using SubscriptionManager.Auth.API.Controllers;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Models;
using SubscriptionManager.Core.Models.Responses;
using System.Security.Claims;

namespace SubscriptionManager.Tests
{
    public class UsersControllerTests
    {
        [Fact]
        public async Task GetCurrentUser_WithValidToken_ReturnsUserDetails()
        {
            var userId = Guid.NewGuid();
            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                FirstName = "John",
                LastName = "Doe",
                IsEmailVerified = true,
                CreatedAt = DateTime.UtcNow
            };

            var userRepository = new TestUserRepository(user);
            var mockLogger = new Mock<ILogger<UsersController>>();
            var controller = new UsersController(userRepository, null!, mockLogger.Object);

            var claims = new[]
            {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        };
            var identity = new ClaimsIdentity(claims, "Test");
            var principal = new ClaimsPrincipal(identity);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };

            var result = await controller.GetCurrentUser();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<UserDetailsResponse>(okResult.Value);

            Assert.Equal(user.Id.ToString(), response.Id);
            Assert.Equal(user.Email, response.Email);
            Assert.Equal(user.FirstName, response.FirstName);
            Assert.Equal(user.LastName, response.LastName);
            Assert.Equal(user.IsEmailVerified, response.IsEmailVerified);
        }

        [Fact]
        public async Task GetCurrentUser_WithoutUserIdClaim_ReturnsUnauthorized()
        {
            var userRepository = new TestUserRepository(null!);
            var mockLogger = new Mock<ILogger<UsersController>>();
            var controller = new UsersController(userRepository, null!, mockLogger.Object);

            var claims = new Claim[] { };
            var identity = new ClaimsIdentity(claims, "Test");
            var principal = new ClaimsPrincipal(identity);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };

            var result = await controller.GetCurrentUser();

            var objectResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(StatusCodes.Status401Unauthorized, objectResult.StatusCode);
        }

        [Fact]
        public async Task GetCurrentUser_WithInvalidUserId_ReturnsUnauthorized()
        {
            var userRepository = new TestUserRepository(null!);
            var mockLogger = new Mock<ILogger<UsersController>>();
            var controller = new UsersController(userRepository, null!, mockLogger.Object);

            var claims = new[]
            {
            new Claim(ClaimTypes.NameIdentifier, "invalid-guid")
        };
            var identity = new ClaimsIdentity(claims, "Test");
            var principal = new ClaimsPrincipal(identity);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };

            var result = await controller.GetCurrentUser();

            var objectResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(StatusCodes.Status401Unauthorized, objectResult.StatusCode);
        }

        [Fact]
        public async Task GetCurrentUser_WithNonExistentUser_ReturnsUnauthorized()
        {
            var userId = Guid.NewGuid();
            var userRepository = new TestUserRepository(null!);
            var mockLogger = new Mock<ILogger<UsersController>>();
            var controller = new UsersController(userRepository, null!, mockLogger.Object);

            var claims = new[]
            {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        };
            var identity = new ClaimsIdentity(claims, "Test");
            var principal = new ClaimsPrincipal(identity);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };

            var result = await controller.GetCurrentUser();

            var objectResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(StatusCodes.Status401Unauthorized, objectResult.StatusCode);
        }

        private class TestUserRepository : IUserRepository
        {
            private readonly User _user;

            public TestUserRepository(User user)
            {
                _user = user;
            }

            public Task<User?> GetByIdAsync(Guid id) => Task.FromResult(_user)!;
            public Task<User?> GetByEmailAsync(string email) => Task.FromResult<User?>(null);
            public Task<User?> GetByRefreshTokenAsync(string refreshToken) => Task.FromResult<User?>(null);
            public Task<bool> ExistsByEmailAsync(string email) => Task.FromResult(false);
            public Task<bool> IsEmailTakenAsync(string email, Guid excludeUserId)
            {
                return Task.FromResult(false);
            }
            public Task AddAsync(User user) => Task.CompletedTask;
            public Task UpdateAsync(User user) => Task.CompletedTask;
            public Task SaveChangesAsync() => Task.CompletedTask;
        }
    }
}