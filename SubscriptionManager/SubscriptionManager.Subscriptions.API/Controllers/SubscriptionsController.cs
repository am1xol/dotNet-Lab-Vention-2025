using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using SubscriptionManager.Core;
using SubscriptionManager.Core.DTOs;
using SubscriptionManager.Subscriptions.Infrastructure.Services;
using System.Data;

namespace SubscriptionManager.Subscriptions.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SubscriptionsController : ControllerBase
    {
        private readonly string _connectionString;
        private readonly IFileStorageService _fileStorageService;
        private readonly ILogger<SubscriptionsController> _logger;

        private static readonly decimal[] AllowedPrices = { 10m, 20m, 50m };

        public SubscriptionsController(
            IConfiguration configuration,
            IFileStorageService fileStorageService,
            ILogger<SubscriptionsController> logger)
        {
            _connectionString = configuration.GetConnectionString("SubscriptionsConnection")
                ?? throw new InvalidOperationException("Connection string 'SubscriptionsConnection' not found.");
            _fileStorageService = fileStorageService;
            _logger = logger;
        }

        [HttpGet("categories")]
        public async Task<ActionResult<List<string>>> GetCategories()
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = "sp_Subscriptions_GetCategories";
            var categories = await connection.QueryAsync<string>(sql, commandType: CommandType.StoredProcedure);
            return Ok(categories.ToList());
        }

        [HttpGet]
        [ProducesResponseType(typeof(PagedResult<SubscriptionDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<PagedResult<SubscriptionDto>>> GetSubscriptions(
            [FromQuery] PaginationParams pq,
            [FromQuery] string? category = null,
            [FromQuery] string? search = null,
            [FromQuery] decimal? minPrice = null,
            [FromQuery] decimal? maxPrice = null,
            [FromQuery] string? orderBy = null,
            [FromQuery] bool? descending = null)
        {
            using var connection = new SqlConnection(_connectionString);
            
            var parameters = new DynamicParameters();
            parameters.Add("@PageNumber", pq.PageNumber);
            parameters.Add("@PageSize", pq.PageSize);
            parameters.Add("@Category", category);
            parameters.Add("@SearchTerm", search);
            parameters.Add("@MinPrice", minPrice);
            parameters.Add("@MaxPrice", maxPrice);
            parameters.Add("@OrderBy", orderBy ?? "date");
            parameters.Add("@Descending", descending ?? true);
            parameters.Add("@TotalCount", dbType: DbType.Int32, direction: ParameterDirection.Output);

            using var multi = await connection.QueryMultipleAsync(
                "sp_Subscriptions_GetPagedExtended",
                parameters,
                commandType: CommandType.StoredProcedure);

            var subscriptions = (await multi.ReadAsync<Subscription>()).ToList();
            var allPrices = (await multi.ReadAsync<SubscriptionPriceDto>()).ToList();
            var totalCount = parameters.Get<int>("@TotalCount");

            var dtos = subscriptions.Select(MapToDto).ToList();

            var pricesBySubscription = allPrices.GroupBy(p => p.SubscriptionId)
                                                .ToDictionary(g => g.Key, g => g.ToList());

            foreach (var dto in dtos)
            {
                dto.Prices = pricesBySubscription.GetValueOrDefault(dto.Id, new List<SubscriptionPriceDto>());

                if (dto.IconFileId.HasValue)
                {
                    try { dto.IconUrl = await _fileStorageService.GetPresignedUrlAsync(dto.IconFileId.Value); }
                    catch { dto.IconUrl = null; }
                }
            }

            return Ok(new PagedResult<SubscriptionDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = pq.PageNumber,
                PageSize = pq.PageSize
            });
        }

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(SubscriptionDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<SubscriptionDto>> GetSubscription(Guid id)
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = "sp_Subscriptions_GetById";
            var subscription = await connection.QueryFirstOrDefaultAsync<Subscription>(
                sql,
                new { Id = id },
                commandType: CommandType.StoredProcedure);

            if (subscription == null || !subscription.IsActive)
                return NotFound();

            var subscriptionDto = MapToDto(subscription);

            if (subscription.IconFileId.HasValue)
            {
                try
                {
                    subscriptionDto.IconUrl = await _fileStorageService.GetPresignedUrlAsync(subscription.IconFileId.Value);
                }
                catch
                {
                    subscriptionDto.IconUrl = null;
                }
            }

            return subscriptionDto;
        }

        [HttpGet("admin/all")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(Dictionary<string, List<SubscriptionDto>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<Dictionary<string, List<SubscriptionDto>>>> GetAllSubscriptionsForAdmin()
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = "SELECT * FROM Subscriptions";
            var subscriptions = await connection.QueryAsync<Subscription>(sql);

            var dtos = subscriptions.Select(MapToDto).ToList();

            foreach (var dto in dtos)
            {
                if (dto.IconFileId.HasValue)
                {
                    try
                    {
                        dto.IconUrl = await _fileStorageService.GetPresignedUrlAsync(dto.IconFileId.Value);
                    }
                    catch
                    {
                        dto.IconUrl = null;
                    }
                }
            }

            var groupedSubscriptions = dtos
                .GroupBy(s => s.Category)
                .ToDictionary(g => g.Key, g => g.ToList());

            return Ok(groupedSubscriptions);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(SubscriptionDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<SubscriptionDto>> CreateSubscription(CreateSubscriptionRequest request)
        {
            if (HasLeadingWhitespace(request.Name) ||
                HasLeadingWhitespace(request.Description) ||
                HasLeadingWhitespace(request.Category))
            {
                return BadRequest("Name, description and category cannot start with spaces.");
            }

            if (request.IconFileId.HasValue)
            {
                using var connection = new SqlConnection(_connectionString);
                const string checkFileSql = "SELECT COUNT(1) FROM StoredFiles WHERE Id = @Id";
                var fileExists = await connection.ExecuteScalarAsync<int>(checkFileSql, new { Id = request.IconFileId.Value }) > 0;
                if (!fileExists)
                    return BadRequest("Icon file not found");
            }

            if (!AllowedPrices.Contains(request.Price))
                return BadRequest($"Invalid price. Allowed prices are: {string.Join(", ", AllowedPrices)}");

            var subscription = new Subscription
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Description = request.Description,
                DescriptionMarkdown = request.DescriptionMarkdown,
                Price = request.Price,
                Category = request.Category,
                IconFileId = request.IconFileId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            using var connection2 = new SqlConnection(_connectionString);
            const string sql = "sp_Subscriptions_Insert";
            await connection2.ExecuteAsync(sql, new
            {
                subscription.Id,
                subscription.Name,
                subscription.Description,
                subscription.DescriptionMarkdown,
                subscription.Price,
                subscription.Category,
                subscription.IconFileId,
                subscription.IsActive
            }, commandType: CommandType.StoredProcedure);

            var subscriptionDto = MapToDto(subscription);

            if (subscription.IconFileId.HasValue)
            {
                try
                {
                    subscriptionDto.IconUrl = await _fileStorageService.GetPresignedUrlAsync(subscription.IconFileId.Value);
                }
                catch
                {
                    subscriptionDto.IconUrl = null;
                }
            }

            return CreatedAtAction(nameof(GetSubscription), new { id = subscription.Id }, subscriptionDto);
        }

        [HttpPost("with-price")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(SubscriptionDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<SubscriptionDto>> CreateSubscriptionWithPrice(CreateSubscriptionWithPriceRequest request)
        {
            if (HasLeadingWhitespace(request.Name) ||
                HasLeadingWhitespace(request.Description) ||
                HasLeadingWhitespace(request.Category))
            {
                return BadRequest("Name, description and category cannot start with spaces.");
            }

            using var connection = new SqlConnection(_connectionString);
            var subscriptionId = Guid.NewGuid();

            try
            {
                using var multi = await connection.QueryMultipleAsync(
                    "sp_Subscriptions_InsertWithPrice",
                    new
                    {
                        Id = subscriptionId,
                        request.Name,
                        request.Description,
                        request.DescriptionMarkdown,
                        request.Price,
                        request.Category,
                        request.IconFileId,
                        request.PeriodId,
                        request.FinalPrice
                    },
                    commandType: CommandType.StoredProcedure);

                var subscription = await multi.ReadFirstOrDefaultAsync<Subscription>();
                var prices = (await multi.ReadAsync<SubscriptionPriceDto>()).ToList();

                if (subscription == null)
                    return StatusCode(500, "Failed to create subscription");

                var dto = MapToDto(subscription);
                dto.Prices = prices;

                if (dto.IconFileId.HasValue)
                {
                    try
                    {
                        dto.IconUrl = await _fileStorageService.GetPresignedUrlAsync(dto.IconFileId.Value);
                    }
                    catch
                    {
                        dto.IconUrl = null;
                    }
                }

                return CreatedAtAction(nameof(GetSubscription), new { id = subscriptionId }, dto);
            }
            catch (SqlException ex) when (ex.Number >= 50000)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating subscription with price");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateSubscription(Guid id, UpdateSubscriptionRequest request)
        {
            if (HasLeadingWhitespace(request.Name) ||
                HasLeadingWhitespace(request.Description) ||
                HasLeadingWhitespace(request.Category))
            {
                return BadRequest("Name, description and category cannot start with spaces.");
            }

            if (request.IconFileId.HasValue)
            {
                using var connection = new SqlConnection(_connectionString);
                const string checkFileSql = "SELECT COUNT(1) FROM StoredFiles WHERE Id = @Id";
                var fileExists = await connection.ExecuteScalarAsync<int>(checkFileSql, new { Id = request.IconFileId.Value }) > 0;
                if (!fileExists)
                    return BadRequest("Icon file not found");
            }

            using var connection2 = new SqlConnection(_connectionString);
            const string checkSubSql = "SELECT COUNT(1) FROM Subscriptions WHERE Id = @Id";
            var subExists = await connection2.ExecuteScalarAsync<int>(checkSubSql, new { Id = id }) > 0;
            if (!subExists)
                return NotFound();

            if (!AllowedPrices.Contains(request.Price))
                return BadRequest($"Invalid price. Allowed prices are: {string.Join(", ", AllowedPrices)}");

            const string sql = "sp_Subscriptions_Update";
            await connection2.ExecuteAsync(sql, new
            {
                Id = id,
                request.Name,
                request.Description,
                request.DescriptionMarkdown,
                request.Price,
                request.Category,
                request.IconFileId,
                IsActive = true
            }, commandType: CommandType.StoredProcedure);

            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteSubscription(Guid id)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            using var transaction = await connection.BeginTransactionAsync();

            try
            {
                const string getSubSql = "SELECT * FROM Subscriptions WHERE Id = @Id";
                var subscription = await connection.QueryFirstOrDefaultAsync<Subscription>(
                    getSubSql,
                    new { Id = id },
                    transaction);

                if (subscription == null)
                {
                    await transaction.RollbackAsync();
                    return NotFound();
                }

                const string checkActiveSql = @"
                    SELECT COUNT(1) FROM UserSubscriptions 
                    WHERE SubscriptionId = @Id AND IsActive = 1";
                var activeCount = await connection.ExecuteScalarAsync<int>(
                    checkActiveSql,
                    new { Id = id },
                    transaction);

                if (activeCount > 0)
                {
                    await transaction.RollbackAsync();
                    return BadRequest(new
                    {
                        message = "Cannot delete subscription with active users. Cancel all user subscriptions first or deactivate instead.",
                        activeUsersCount = activeCount
                    });
                }

                const string checkHistorySql = "SELECT COUNT(1) FROM UserSubscriptions WHERE SubscriptionId = @Id";
                var historyCount = await connection.ExecuteScalarAsync<int>(
                    checkHistorySql,
                    new { Id = id },
                    transaction);

                if (historyCount > 0)
                {
                    const string deactivateSql = "sp_Subscriptions_UpdateActive";
                    await connection.ExecuteAsync(
                        deactivateSql,
                        new { Id = id, IsActive = false },
                        transaction,
                        commandType: CommandType.StoredProcedure);

                    await transaction.CommitAsync();

                    return Ok(new
                    {
                        message = "Subscription deactivated because it has historical user data. It cannot be fully deleted.",
                        subscriptionId = id
                    });
                }
                else
                {
                    const string deleteSql = "DELETE FROM Subscriptions WHERE Id = @Id";
                    await connection.ExecuteAsync(deleteSql, new { Id = id }, transaction);

                    await transaction.CommitAsync();
                    return NoContent();
                }
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        [HttpPatch("{id}/active")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateSubscriptionActive(Guid id, [FromBody] UpdateActiveRequest request)
        {
            using var connection = new SqlConnection(_connectionString);
            
            var parameters = new DynamicParameters();
            parameters.Add("@Id", id);
            parameters.Add("@IsActive", request.IsActive);
            parameters.Add("@ReturnValue", dbType: DbType.Int32, direction: ParameterDirection.ReturnValue);

            await connection.ExecuteAsync(
                "sp_Subscriptions_UpdateActive",
                parameters,
                commandType: CommandType.StoredProcedure);

            var result = parameters.Get<int>("@ReturnValue");

            return result switch
            {
                204 => NoContent(),
                404 => NotFound(),
                _ => StatusCode(500)
            };
        }

        public class UpdateActiveRequest
        {
            public bool IsActive { get; set; }
        }

        private static SubscriptionDto MapToDto(Subscription subscription)
        {
            return new SubscriptionDto
            {
                Id = subscription.Id,
                Name = subscription.Name,
                Description = subscription.Description,
                DescriptionMarkdown = subscription.DescriptionMarkdown,
                Price = subscription.Price,
                Category = subscription.Category,
                IconFileId = subscription.IconFileId,
                IconUrl = null,
                IsActive = subscription.IsActive,
                CreatedAt = subscription.CreatedAt,
                UpdatedAt = subscription.UpdatedAt,
                Prices = new List<SubscriptionPriceDto>()
            };
        }

        private static bool HasLeadingWhitespace(string? value)
        {
            return !string.IsNullOrEmpty(value) && char.IsWhiteSpace(value[0]);
        }
    }
}