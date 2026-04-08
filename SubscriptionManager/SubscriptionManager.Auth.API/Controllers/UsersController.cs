using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubscriptionManager.Core.Constants;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Models.Requests;
using SubscriptionManager.Core.Models.Responses;
using System.Security.Claims;

namespace SubscriptionManager.Auth.API.Controllers
{
    [ApiController]
    [Route("")]
    [Route("api/[controller]")]
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
        [Authorize]
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
                Role = user.Role,
                SubscriptionExpiryReminderDays = user.SubscriptionExpiryReminderDays
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

            var isEmailChanged = !string.Equals(user.Email, request.Email, StringComparison.OrdinalIgnoreCase);
            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.Email = request.Email;
            user.SubscriptionExpiryReminderDays = request.SubscriptionExpiryReminderDays;
            user.UpdatedAt = DateTime.UtcNow;

            if (isEmailChanged)
            {
                user.IsEmailVerified = false;
            }

            await _userRepository.UpdateAsync(user);
            await _userRepository.UpdateSubscriptionExpiryReminderDaysAsync(
                user.Id,
                request.SubscriptionExpiryReminderDays);
            await _userRepository.SaveChangesAsync();

            var response = new UserDetailsResponse
            {
                Id = user.Id.ToString(),
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                IsEmailVerified = user.IsEmailVerified,
                CreatedAt = user.CreatedAt,
                SubscriptionExpiryReminderDays = user.SubscriptionExpiryReminderDays
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

        [HttpGet("all-users")]
        [Authorize(Roles = RoleConstants.Admin)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<PagedResponse<UserDetailsResponse>>> GetAllUsers(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? searchTerm = null)
        {
            var (users, totalCount) = await _userRepository.GetPagedUsersAsync(pageNumber, pageSize, searchTerm);

            var userDetails = users.Select(user => new UserDetailsResponse
            {
                Id = user.Id.ToString(),
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                IsEmailVerified = user.IsEmailVerified,
                IsBlocked = user.IsBlocked,
                CreatedAt = user.CreatedAt,
                Role = user.Role,
                SubscriptionExpiryReminderDays = user.SubscriptionExpiryReminderDays
            });

            return Ok(new PagedResponse<UserDetailsResponse>
            {
                Items = userDetails,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            });
        }

        [HttpPost("{id}/block")]
        [Authorize(Roles = RoleConstants.Admin)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> BlockUser(Guid id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return NotFound();

            if (user.Role == RoleConstants.Admin)
                return BadRequest("Cannot block another admin.");

            user.IsBlocked = true;
            user.UpdatedAt = DateTime.UtcNow;

            await _userRepository.UpdateAsync(user);
            await _userRepository.SaveChangesAsync();

            return Ok(new { message = "User blocked successfully" });
        }

        [HttpPost("{id}/unblock")]
        [Authorize(Roles = RoleConstants.Admin)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UnblockUser(Guid id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return NotFound();

            user.IsBlocked = false;
            user.UpdatedAt = DateTime.UtcNow;

            await _userRepository.UpdateAsync(user);
            await _userRepository.SaveChangesAsync();

            return Ok(new { message = "User unblocked successfully" });
        }
    }
}
