using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Models.Requests;
using SubscriptionManager.Core.Models.Responses;
using System.Security.Claims;

namespace SubscriptionManager.Auth.API.Controllers
{
    public class UsersController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ILogger<UsersController> _logger;

        public UsersController(
            IUserRepository userRepository,
            IPasswordHasher passwordHasher,
            ILogger<UsersController> logger)
        {
            _userRepository = userRepository;
            _passwordHasher = passwordHasher;
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
                CreatedAt = user.CreatedAt,
                Role = user.Role
            };

            return Ok(response);
        }

        [HttpPut("profile")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<UserDetailsResponse>> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized();
            }

            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return Unauthorized();
            }

            if (user.Email != request.Email && await _userRepository.IsEmailTakenAsync(request.Email, userId))
            {
                return Problem(
                    title: "Email is already taken",
                    statusCode: StatusCodes.Status409Conflict);
            }

            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.Email = request.Email;
            user.UpdatedAt = DateTime.UtcNow;

            if (user.Email != request.Email)
            {
                user.IsEmailVerified = false;
            }

            await _userRepository.UpdateAsync(user);
            await _userRepository.SaveChangesAsync();

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

        [HttpPut("change-password")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized();
            }

            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return Unauthorized();
            }

            if (!_passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash))
            {
                return Problem(
                    title: "Current password is incorrect",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            await _userRepository.UpdateAsync(user);
            await _userRepository.SaveChangesAsync();

            return Ok(new { message = "Password changed successfully" });
        }
    }
}
