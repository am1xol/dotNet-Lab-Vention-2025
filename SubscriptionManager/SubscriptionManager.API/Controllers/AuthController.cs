using Microsoft.AspNetCore.Mvc;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Models;
using SubscriptionManager.Core.Models.Requests;
using SubscriptionManager.Core.Models.Responses;

namespace SubscriptionManager.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;

    public AuthController(IUserRepository userRepository, IPasswordHasher passwordHasher)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResult>> Register(RegisterRequest request)
    {
        var result = new AuthResult();

        if (!ModelState.IsValid)
        {
            result.Success = false;
            result.Errors.AddRange(ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage));
            return BadRequest(result);
        }

        if (await _userRepository.ExistsByEmailAsync(request.Email))
        {
            result.Success = false;
            result.Errors.Add("Email already exists");
            return Conflict(result);
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _userRepository.AddAsync(user);
        await _userRepository.SaveChangesAsync();

        result.Success = true;
        result.UserId = user.Id.ToString();
        return Ok(result);
    }
}