using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using SubscriptionManager.Core.DTOs;

namespace SubscriptionManager.Subscriptions.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class ReportsController : ControllerBase
    {
        private readonly string _connectionString;

        public ReportsController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("SubscriptionsConnection")
                ?? throw new InvalidOperationException("Connection string 'SubscriptionsConnection' not found.");
        }

        [HttpGet("active-by-plan")]
        [ProducesResponseType(typeof(IEnumerable<ActiveSubscriptionsByPlanDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<ActiveSubscriptionsByPlanDto>>> GetActiveSubscriptionsByPlan()
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = "sp_Report_ActiveSubscriptionsByPlan";

            var results = await connection.QueryAsync<ActiveSubscriptionsByPlanDto>(
                sql,
                commandType: System.Data.CommandType.StoredProcedure);

            return Ok(results);
        }

        [HttpGet("subscriptions-with-plans")]
        [ProducesResponseType(typeof(IEnumerable<SubscriptionWithPlansDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<SubscriptionWithPlansDto>>> GetSubscriptionsWithPlans()
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = "sp_Report_SubscriptionsWithPlans";

            var results = await connection.QueryAsync<SubscriptionWithPlansDto>(
                sql,
                commandType: System.Data.CommandType.StoredProcedure);

            return Ok(results);
        }

        [HttpGet("top-popular")]
        [ProducesResponseType(typeof(IEnumerable<TopPopularSubscriptionDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<TopPopularSubscriptionDto>>> GetTopPopularSubscriptions(
            [FromQuery] int topCount = 10)
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = "sp_Report_TopPopularSubscriptions";

            var results = await connection.QueryAsync<TopPopularSubscriptionDto>(
                sql,
                new { TopCount = topCount },
                commandType: System.Data.CommandType.StoredProcedure);

            return Ok(results);
        }

        [HttpGet("by-month")]
        [ProducesResponseType(typeof(IEnumerable<SubscriptionsByMonthDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<SubscriptionsByMonthDto>>> GetSubscriptionsByMonth(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            var from = startDate ?? DateTime.UtcNow.AddMonths(-12);
            var to = endDate ?? DateTime.UtcNow;

            using var connection = new SqlConnection(_connectionString);
            const string sql = "sp_Report_SubscriptionsByMonth";

            var results = await connection.QueryAsync<SubscriptionsByMonthDto>(
                sql,
                new { StartDate = from, EndDate = to },
                commandType: System.Data.CommandType.StoredProcedure);

            return Ok(results);
        }

        [HttpGet("user-subscriptions")]
        [ProducesResponseType(typeof(IEnumerable<UserSubscriptionReportItemDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<UserSubscriptionReportItemDto>>> GetUserSubscriptionsReport(
            [FromQuery] Guid userId)
        {
            if (userId == Guid.Empty)
            {
                return BadRequest("UserId is required");
            }

            using var connection = new SqlConnection(_connectionString);
            const string sql = "sp_Report_UserSubscriptions";

            var results = await connection.QueryAsync<UserSubscriptionReportItemDto>(
                sql,
                new { UserId = userId },
                commandType: System.Data.CommandType.StoredProcedure);

            return Ok(results);
        }
    }
}

