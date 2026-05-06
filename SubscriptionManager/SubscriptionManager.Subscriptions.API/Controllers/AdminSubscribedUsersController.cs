using System.Data;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using SubscriptionManager.Core;
using SubscriptionManager.Core.Models.Responses;

namespace SubscriptionManager.Subscriptions.API.Controllers;

[ApiController]
[Route("api/admin/subscribed-users")]
[Authorize(Roles = "Admin")]
public class AdminSubscribedUsersController : ControllerBase
{
    private readonly string _connectionString;

    public AdminSubscribedUsersController(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("SubscriptionsConnection")
            ?? throw new InvalidOperationException("Connection string 'SubscriptionsConnection' not found.");
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<UserDetailsResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PagedResponse<UserDetailsResponse>>> GetUsersBySubscription(
        [FromQuery] Guid subscriptionId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] bool activeOnly = true,
        [FromQuery] bool withPurchasesOnly = false)
    {
        if (pageNumber < 1 || pageSize < 1 || pageSize > 100)
        {
            return BadRequest("Invalid pagination parameters.");
        }

        using var connection = new SqlConnection(_connectionString);
        if (!withPurchasesOnly)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@SubscriptionId", subscriptionId);
            parameters.Add("@PageNumber", pageNumber);
            parameters.Add("@PageSize", pageSize);
            parameters.Add("@SearchTerm", string.IsNullOrWhiteSpace(searchTerm) ? null : searchTerm.Trim());
            parameters.Add("@ActiveOnly", activeOnly);
            parameters.Add("@TotalCount", dbType: DbType.Int32, direction: ParameterDirection.Output);

            var rows = await connection.QueryAsync<UserRow>(
                "dbo.sp_Admin_GetUsersBySubscriptionPaged",
                parameters,
                commandType: CommandType.StoredProcedure);

            var totalCount = parameters.Get<int>("@TotalCount");

            var items = rows.Select(r => new UserDetailsResponse
            {
                Id = r.Id.ToString(),
                Email = r.Email,
                FirstName = r.FirstName,
                LastName = r.LastName,
                IsEmailVerified = r.IsEmailVerified,
                IsBlocked = r.IsBlocked,
                CreatedAt = r.CreatedAt,
                Role = r.Role,
                SubscriptionExpiryReminderDays = r.SubscriptionExpiryReminderDays
            });

            return Ok(new PagedResponse<UserDetailsResponse>
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            });
        }

        const int scanPageSize = 100;
        var normalizedSearch = string.IsNullOrWhiteSpace(searchTerm) ? null : searchTerm.Trim();
        var desiredStartIndex = (pageNumber - 1) * pageSize;
        var desiredEndExclusive = desiredStartIndex + pageSize;

        var filteredTotalCount = 0;
        var pageItems = new List<UserRow>(capacity: pageSize);

        int? unfilteredTotal = null;
        var scanPageNumber = 1;

        while (!unfilteredTotal.HasValue || (scanPageNumber - 1) * scanPageSize < unfilteredTotal.Value)
        {
            var scanParams = new DynamicParameters();
            scanParams.Add("@SubscriptionId", subscriptionId);
            scanParams.Add("@PageNumber", scanPageNumber);
            scanParams.Add("@PageSize", scanPageSize);
            scanParams.Add("@SearchTerm", normalizedSearch);
            scanParams.Add("@ActiveOnly", activeOnly);
            scanParams.Add("@TotalCount", dbType: DbType.Int32, direction: ParameterDirection.Output);

            var scanRows = (await connection.QueryAsync<UserRow>(
                "dbo.sp_Admin_GetUsersBySubscriptionPaged",
                scanParams,
                commandType: CommandType.StoredProcedure)).ToList();

            unfilteredTotal ??= scanParams.Get<int>("@TotalCount");

            if (scanRows.Count == 0)
            {
                break;
            }

            var userIds = scanRows.Select(r => r.Id).Distinct().ToArray();
            var paidUserIds = new HashSet<Guid>(await connection.QueryAsync<Guid>(
                """
                SELECT DISTINCT UserId
                FROM Payments
                WHERE Status = @CompletedStatus AND UserId IN @UserIds
                """,
                new
                {
                    CompletedStatus = (int)PaymentStatus.Completed,
                    UserIds = userIds
                }));

            foreach (var row in scanRows)
            {
                if (!paidUserIds.Contains(row.Id))
                {
                    continue;
                }

                if (filteredTotalCount >= desiredStartIndex && filteredTotalCount < desiredEndExclusive)
                {
                    pageItems.Add(row);
                }

                filteredTotalCount++;
            }

            scanPageNumber++;
        }

        var pagedItems = pageItems.Select(r => new UserDetailsResponse
        {
            Id = r.Id.ToString(),
            Email = r.Email,
            FirstName = r.FirstName,
            LastName = r.LastName,
            IsEmailVerified = r.IsEmailVerified,
            IsBlocked = r.IsBlocked,
            CreatedAt = r.CreatedAt,
            Role = r.Role,
            SubscriptionExpiryReminderDays = r.SubscriptionExpiryReminderDays
        });

        return Ok(new PagedResponse<UserDetailsResponse>
        {
            Items = pagedItems,
            TotalCount = filteredTotalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        });
    }

    private sealed class UserRow
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public bool IsEmailVerified { get; set; }
        public bool IsBlocked { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Role { get; set; } = "User";
        public int SubscriptionExpiryReminderDays { get; set; }
    }
}
