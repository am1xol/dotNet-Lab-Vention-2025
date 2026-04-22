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

        [HttpGet("user-activity-period")]
        [ProducesResponseType(typeof(IEnumerable<UserActivityByPeriodDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<UserActivityByPeriodDto>>> GetUserActivityByPeriod(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            var from = startDate ?? DateTime.UtcNow.AddDays(-30);
            var to = endDate ?? DateTime.UtcNow;

            using var connection = new SqlConnection(_connectionString);
            const string sql = "dbo.sp_Report_UserActivityByPeriod";

            var results = await connection.QueryAsync<UserActivityByPeriodDto>(
                sql,
                new { StartDate = from, EndDate = to },
                commandType: System.Data.CommandType.StoredProcedure);

            return Ok(results);
        }

        [HttpGet("subscriptions-period")]
        [ProducesResponseType(typeof(IEnumerable<SubscriptionsByPeriodDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<SubscriptionsByPeriodDto>>> GetSubscriptionsByPeriod(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            var from = startDate ?? DateTime.UtcNow.AddDays(-30);
            var to = endDate ?? DateTime.UtcNow;

            using var connection = new SqlConnection(_connectionString);
            const string sql = "dbo.sp_Report_SubscriptionsByPeriod";

            var results = await connection.QueryAsync<SubscriptionsByPeriodDto>(
                sql,
                new { StartDate = from, EndDate = to },
                commandType: System.Data.CommandType.StoredProcedure);

            return Ok(results);
        }

        [HttpGet("subscriber-subscriptions")]
        [ProducesResponseType(typeof(IEnumerable<UserSubscriptionReportItemDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<UserSubscriptionReportItemDto>>> GetSubscriberSubscriptionsReport(
            [FromQuery] string email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return BadRequest("Email is required");
            }

            using var connection = new SqlConnection(_connectionString);
            const string sql = "dbo.sp_Report_UserSubscriptions";

            var results = await connection.QueryAsync<UserSubscriptionReportItemDto>(
                sql,
                new { Email = email.Trim() },
                commandType: System.Data.CommandType.StoredProcedure);

            return Ok(results);
        }

        [HttpGet("analytics-dashboard")]
        [ProducesResponseType(typeof(AdminAnalyticsDashboardDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<AdminAnalyticsDashboardDto>> GetAnalyticsDashboard(
            [FromQuery] int periodDays = 30,
            [FromQuery] int expiringWithinDays = 7)
        {
            var normalizedPeriodDays = Math.Clamp(periodDays, 1, 365);
            var normalizedExpiringWithinDays = Math.Clamp(expiringWithinDays, 0, 365);
            var periodStart = DateTime.UtcNow.AddDays(-normalizedPeriodDays);

            using var connection = new SqlConnection(_connectionString);

            using var multi = await connection.QueryMultipleAsync(
                "sp_Report_AdminAnalyticsDashboard",
                new
                {
                    PeriodStart = periodStart,
                    ExpiringWithinDays = normalizedExpiringWithinDays
                },
                commandType: System.Data.CommandType.StoredProcedure);

            var dto = new AdminAnalyticsDashboardDto
            {
                ActiveUsersCount = await multi.ReadFirstAsync<int>(),
                NewSubscriptionsCount = await multi.ReadFirstAsync<int>(),
                CancelledSubscriptionsCount = await multi.ReadFirstAsync<int>(),
                PaidSubscriptionsCount = await multi.ReadFirstAsync<int>(),
                ExpiringSubscriptionsCount = await multi.ReadFirstAsync<int>(),
                SuccessfulPaymentsCount = await multi.ReadFirstAsync<int>(),
                FailedPaymentsCount = await multi.ReadFirstAsync<int>(),
                CategoryDistribution = (await multi.ReadAsync<CategoryDistributionItemDto>()).ToList()
            };

            return Ok(dto);
        }
    }
}