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
            var prices = await connection.QueryAsync<SubscriptionPriceDto>(
                "sp_SubscriptionPrices_GetBySubscriptionId",
                new { SubscriptionId = subscriptionId },
                commandType: CommandType.StoredProcedure);
            
            return Ok(prices.ToList());
        }

        [HttpPost]
        public async Task<ActionResult<SubscriptionPriceDto>> Create(CreateSubscriptionPriceRequest request)
        {
            using var connection = new SqlConnection(_connectionString);
            try
            {
                var created = await connection.QueryFirstOrDefaultAsync<SubscriptionPriceDto>(
                    "sp_SubscriptionPrices_Create",
                    new
                    {
                        Id = Guid.NewGuid(),
                        request.SubscriptionId,
                        request.PeriodId,
                        request.FinalPrice
                    },
                    commandType: CommandType.StoredProcedure);

                return CreatedAtAction(nameof(GetBySubscriptionId), 
                    new { subscriptionId = request.SubscriptionId }, created);
            }
            catch (SqlException ex) when (ex.Number >= 50000)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            using var connection = new SqlConnection(_connectionString);
            var parameters = new DynamicParameters();
            parameters.Add("@Id", id);
            parameters.Add("@ReturnValue", dbType: DbType.Int32, direction: ParameterDirection.ReturnValue);

            await connection.ExecuteAsync(
                "sp_SubscriptionPrices_Delete",
                parameters,
                commandType: CommandType.StoredProcedure);

            var result = parameters.Get<int>("@ReturnValue");

            return result switch
            {
                204 => NoContent(),
                404 => NotFound(),
                400 => BadRequest("Cannot delete price because it is used in active user subscriptions"),
                _ => StatusCode(500)
            };
        }
    }
}