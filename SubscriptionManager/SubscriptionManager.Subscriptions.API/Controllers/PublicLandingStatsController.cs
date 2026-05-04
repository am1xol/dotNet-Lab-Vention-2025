using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using SubscriptionManager.Core.Constants;
using SubscriptionManager.Core.DTOs;
using System.Data;

namespace SubscriptionManager.Subscriptions.API.Controllers;

[Route("api/public")]
[ApiController]
public class PublicLandingStatsController : ControllerBase
{
    private readonly string _subscriptionsConnectionString;
    private readonly string _authConnectionString;
    private readonly ILogger<PublicLandingStatsController> _logger;

    public PublicLandingStatsController(
        IConfiguration configuration,
        ILogger<PublicLandingStatsController> logger)
    {
        _subscriptionsConnectionString = configuration.GetConnectionString("SubscriptionsConnection")
            ?? throw new InvalidOperationException("Connection string 'SubscriptionsConnection' not found.");
        _authConnectionString = configuration.GetConnectionString("AuthConnection")
            ?? throw new InvalidOperationException("Connection string 'AuthConnection' not found.");
        _logger = logger;
    }

    [HttpGet("landing-stats")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LandingStatsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<LandingStatsDto>> GetLandingStats(CancellationToken cancellationToken)
    {
        try
        {
            var dto = new LandingStatsDto();

            await using (var subsConn = new SqlConnection(_subscriptionsConnectionString))
            {
                await subsConn.OpenAsync(cancellationToken);
                const string subSql = "SELECT COUNT(1) FROM Subscriptions WHERE IsActive = 1";
                dto.SubscriptionTypesCount = await subsConn.ExecuteScalarAsync<int>(subSql);
            }

            await using (var authConn = new SqlConnection(_authConnectionString))
            {
                await authConn.OpenAsync(cancellationToken);

                const string usersSql = """
                                        SELECT COUNT(1) FROM Users
                                        WHERE IsBlocked = 0 AND Role <> @AdminRole
                                        """;
                dto.ActiveUsersCount = await authConn.ExecuteScalarAsync<int>(
                    usersSql,
                    new { AdminRole = RoleConstants.Admin });

                const string feedbackSql = "sp_Feedbacks_GetAverageRating";
                var feedbackStats = await authConn.QueryFirstOrDefaultAsync<FeedbackStatisticsDto>(
                    feedbackSql,
                    commandType: CommandType.StoredProcedure);

                if (feedbackStats != null && feedbackStats.TotalCount > 0)
                {
                    dto.FeedbackCount = feedbackStats.TotalCount;
                    dto.SatisfactionPercent = (int)Math.Round(
                        feedbackStats.AverageRating / 5.0 * 100.0,
                        MidpointRounding.AwayFromZero);
                }
                else
                {
                    dto.FeedbackCount = 0;
                    dto.SatisfactionPercent = null;
                }
            }

            return Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to load landing stats");
            return Problem(
                title: "Unable to load landing statistics",
                statusCode: StatusCodes.Status500InternalServerError);
        }
    }
}
