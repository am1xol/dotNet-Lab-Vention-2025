using Microsoft.AspNetCore.Mvc;

namespace SubscriptionManager.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { message = "API is working!", timestamp = DateTime.UtcNow });
    }
    
    [HttpPost]
    public IActionResult Post([FromBody] TestModel model)
    {
        return Ok(new { received = model, processedAt = DateTime.UtcNow });
    }
}

public record TestModel(string Name, string Email);