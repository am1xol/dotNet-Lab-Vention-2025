using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Models.Responses;
using System.Security.Claims;

namespace SubscriptionManager.Auth.API.Controllers
{
    public class UsersController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly ILogger<UsersController> _logger;

        public UsersController(
            IUserRepository userRepository,
            ILogger<UsersController> logger)
        {
            _userRepository = userRepository;
            _logger = logger;
        }

        [HttpGet("me")]
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
}
