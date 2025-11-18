using EmailValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Models;
using SubscriptionManager.Core.Models.Requests;
using SubscriptionManager.Core.Models.Responses;
using SubscriptionManager.Infrastructure.Repositories;
using SubscriptionManager.Infrastructure.Services;
using System.Security.Claims;

namespace SubscriptionManager.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IAuthService authService,
        ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [HttpPost("register")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthResult>> Register([FromBody] RegisterRequest request)
    {
        if (!EmailValidator.Validate(request.Email))
        {
            return Problem(
                title: "Invalid email format",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var result = await _authService.RegisterAsync(request);

        if (!result.Success)
        {
            return Problem(
                title: result.Error,
                statusCode: result.Error == "Email already exists"
                    ? StatusCodes.Status409Conflict
                    : StatusCodes.Status400BadRequest);
        }

        return Ok(result);
    }

    [HttpPost("verify-email")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AuthResult>> VerifyEmail([FromBody] VerifyEmailRequest request)
    {
        var result = await _authService.VerifyEmailAsync(request);

        if (!result.Success)
        {
            var statusCode = result.Error switch
            {
                "User not found" => StatusCodes.Status404NotFound,
                _ => StatusCodes.Status400BadRequest
            };

            return Problem(title: result.Error, statusCode: statusCode);
        }

        return Ok(result);
    }

    [HttpPost("login")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
        {
            return Problem(
                title: "Email and password are required",
                statusCode: StatusCodes.Status400BadRequest);
        }

        if (!EmailValidator.Validate(request.Email))
        {
            return Problem(
                title: "Invalid email format",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var result = await _authService.LoginAsync(request);

        if (!result.Success)
        {
            return Problem(
                title: result.Error,
                statusCode: StatusCodes.Status401Unauthorized);
        }

        return Ok(result);
    }

    [HttpPost("refresh")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<RefreshTokenResponse>> Refresh([FromBody] RefreshTokenRequest request)
    {
        var result = await _authService.RefreshTokenAsync(request);

        if (!result.Success)
        {
            return Problem(
                title: result.Error,
                statusCode: StatusCodes.Status401Unauthorized);
        }

        return Ok(result);
    }

    [HttpPost("forgot-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ForgotPasswordResponse>> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        if (!EmailValidator.Validate(request.Email))
        {
            return Problem(
                title: "Invalid email format",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var result = await _authService.ForgotPasswordAsync(request);

        if (!result.Success)
        {
            return Problem(
                title: result.Error,
                statusCode: StatusCodes.Status400BadRequest);
        }

        return Ok(result);
    }

    [HttpPost("reset-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ForgotPasswordResponse>> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (!EmailValidator.Validate(request.Email))
        {
            return Problem(
                title: "Invalid email format",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var result = await _authService.ResetPasswordAsync(request);

        if (!result.Success)
        {
            return Problem(
                title: result.Error,
                statusCode: StatusCodes.Status400BadRequest);
        }

        return Ok(result);
    }
}