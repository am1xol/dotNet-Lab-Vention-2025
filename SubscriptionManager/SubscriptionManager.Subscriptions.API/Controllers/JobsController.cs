using Microsoft.AspNetCore.Mvc;
using SubscriptionManager.Subscriptions.API.Services;

namespace SubscriptionManager.Subscriptions.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class JobsController : ControllerBase
    {
        private readonly IPaymentJobService _jobService;

        public JobsController(IPaymentJobService jobService)
        {
            _jobService = jobService;
        }

        [HttpPost("run-cleanup")]
        public async Task<IActionResult> ManualCleanup()
        {
            var deletedCount = await _jobService.CleanupStuckPaymentsAsync(CancellationToken.None);
            return Ok(new { message = "Cleanup completed", recordsAffected = deletedCount });
        }

        [HttpPost("run-freeze-expiry")]
        public async Task<IActionResult> ManualFreezeExpiry()
        {
            var n = await _jobService.ProcessExpiredFreezesAsync(CancellationToken.None);
            return Ok(new { message = "Freeze expiry processed", subscriptionsResumed = n });
        }
    }
}
