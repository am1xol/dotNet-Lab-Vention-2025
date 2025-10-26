using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;


namespace SubscriptionManager.API.Controllers;

[ApiController]
[ApiExplorerSettings(IgnoreApi = true)]
public class ErrorController : ControllerBase
{
    [Route("/error")]
    public IActionResult HandleError()
    {
        var exceptionHandlerFeature = HttpContext.Features.Get<IExceptionHandlerFeature>();
        var exception = exceptionHandlerFeature?.Error;

        var problemDetails = new ProblemDetails
        {
            Title = "An error occurred",
            Status = StatusCodes.Status500InternalServerError,
            Detail = exception?.Message,
            Instance = HttpContext.Request.Path
        };

        return StatusCode(StatusCodes.Status500InternalServerError, problemDetails);
    }

    [Route("/error/{statusCode}")]
    public IActionResult HandleError(int statusCode)
    {
        var problemDetails = new ProblemDetails
        {
            Title = "An error occurred",
            Status = statusCode,
            Instance = HttpContext.Request.Path
        };

        return StatusCode(statusCode, problemDetails);
    }
}
