using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using SubscriptionManager.Core.DTOs;
using SubscriptionManager.Core.Models;
using System.Data;

namespace SubscriptionManager.Subscriptions.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class SubscriptionPricesController : ControllerBase
    {
        private readonly string _connectionString;

        public SubscriptionPricesController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("SubscriptionsConnection")
                ?? throw new InvalidOperationException("Connection string 'SubscriptionsConnection' not found.");
        }

        [HttpGet("periods")]
        public async Task<ActionResult<List<PeriodDto>>> GetAllPeriods()
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = "SELECT Id, Name, MonthsCount FROM Periods ORDER BY MonthsCount";
            var periods = await connection.QueryAsync<PeriodDto>(sql);
            return Ok(periods.ToList());
        }

        [HttpGet]
        public async Task<ActionResult<List<SubscriptionPriceDto>>> GetBySubscriptionId([FromQuery] Guid subscriptionId)
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = @"
                SELECT sp.*, p.Name AS PeriodName, p.MonthsCount
                FROM SubscriptionPrices sp
                INNER JOIN Periods p ON sp.PeriodId = p.Id
                WHERE sp.SubscriptionId = @SubscriptionId";
            var prices = await connection.QueryAsync<SubscriptionPriceDto>(sql, new { SubscriptionId = subscriptionId });
            return Ok(prices.ToList());
        }

        [HttpPost]
        public async Task<ActionResult<SubscriptionPriceDto>> Create(CreateSubscriptionPriceRequest request)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            using var transaction = await connection.BeginTransactionAsync();

            try
            {
                const string checkSubSql = "SELECT COUNT(1) FROM Subscriptions WHERE Id = @SubscriptionId";
                var subExists = await connection.ExecuteScalarAsync<int>(checkSubSql, new { request.SubscriptionId }, transaction) > 0;
                if (!subExists)
                    return BadRequest("Subscription not found");

                const string checkPeriodSql = "SELECT COUNT(1) FROM Periods WHERE Id = @PeriodId";
                var periodExists = await connection.ExecuteScalarAsync<int>(checkPeriodSql, new { request.PeriodId }, transaction) > 0;
                if (!periodExists)
                    return BadRequest("Period not found");

                const string checkDuplicateSql = @"
                    SELECT COUNT(1) FROM SubscriptionPrices 
                    WHERE SubscriptionId = @SubscriptionId AND PeriodId = @PeriodId";
                var duplicate = await connection.ExecuteScalarAsync<int>(checkDuplicateSql, new { request.SubscriptionId, request.PeriodId }, transaction) > 0;
                if (duplicate)
                    return BadRequest("Price for this subscription and period already exists");

                var id = Guid.NewGuid();
                const string insertSql = @"
                    INSERT INTO SubscriptionPrices (Id, SubscriptionId, PeriodId, FinalPrice)
                    VALUES (@Id, @SubscriptionId, @PeriodId, @FinalPrice)";

                await connection.ExecuteAsync(insertSql, new
                {
                    Id = id,
                    request.SubscriptionId,
                    request.PeriodId,
                    request.FinalPrice
                }, transaction);

                await transaction.CommitAsync();

                const string selectSql = @"
                    SELECT sp.*, p.Name AS PeriodName, p.MonthsCount
                    FROM SubscriptionPrices sp
                    INNER JOIN Periods p ON sp.PeriodId = p.Id
                    WHERE sp.Id = @Id";
                var created = await connection.QueryFirstOrDefaultAsync<SubscriptionPriceDto>(selectSql, new { Id = id });
                return CreatedAtAction(nameof(GetBySubscriptionId), new { subscriptionId = request.SubscriptionId }, created);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            using var connection = new SqlConnection(_connectionString);
            const string checkSql = "SELECT COUNT(1) FROM SubscriptionPrices WHERE Id = @Id";
            var exists = await connection.ExecuteScalarAsync<int>(checkSql, new { Id = id }) > 0;
            if (!exists)
                return NotFound();

            const string checkUsageSql = @"
                SELECT COUNT(1) FROM UserSubscriptions 
                WHERE SubscriptionPriceId = @Id AND IsActive = 1";
            var inUse = await connection.ExecuteScalarAsync<int>(checkUsageSql, new { Id = id }) > 0;
            if (inUse)
                return BadRequest("Cannot delete price because it is used in active user subscriptions");

            const string deleteSql = "DELETE FROM SubscriptionPrices WHERE Id = @Id";
            await connection.ExecuteAsync(deleteSql, new { Id = id });
            return NoContent();
        }
    }
}