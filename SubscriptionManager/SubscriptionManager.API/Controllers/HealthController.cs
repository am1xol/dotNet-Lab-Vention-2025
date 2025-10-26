using Microsoft.AspNetCore.Mvc;
using SubscriptionManager.Infrastructure.Data;

namespace SubscriptionManager.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            status = "Healthy",
            timestamp = DateTime.UtcNow,
            service = "Subscription Manager API"
        });
    }

    [HttpGet("detailed")]
    public async Task<IActionResult> GetDetailed([FromServices] ApplicationDbContext context)
    {
        try
        {
            var canConnect = await context.Database.CanConnectAsync();

            return Ok(new
            {
                status = "Healthy",
                timestamp = DateTime.UtcNow,
                database = canConnect ? "Connected" : "Disconnected",
                service = "Subscription Manager API"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                status = "Unhealthy",
                timestamp = DateTime.UtcNow,
                database = "Error",
                error = ex.Message
            });
        }
    }
}
