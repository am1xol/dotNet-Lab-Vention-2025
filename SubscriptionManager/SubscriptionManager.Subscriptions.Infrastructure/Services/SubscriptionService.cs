using AutoMapper;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using SubscriptionManager.Core;
using SubscriptionManager.Core.DTOs;
using System.Data;

namespace SubscriptionManager.Subscriptions.Infrastructure.Services
{
    public interface ISubscriptionService
    {
        Task ProcessExpiredSubscriptionsAsync();
    }
    public class SubscriptionService : ISubscriptionService
    {
        private readonly string _connectionString;
        private readonly IMapper _mapper;
        private readonly IFileStorageService _fileStorageService;

        public SubscriptionService(
            IConfiguration configuration,
            IMapper mapper,
            IFileStorageService fileStorageService)
        {
            _connectionString = configuration.GetConnectionString("SubscriptionsConnection")
                ?? throw new InvalidOperationException("Connection string 'SubscriptionsConnection' not found.");
            _mapper = mapper;
            _fileStorageService = fileStorageService;
        }

        public async Task ProcessExpiredSubscriptionsAsync()
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = "sp_Subscriptions_ProcessExpired";
            await connection.ExecuteAsync(sql, commandType: CommandType.StoredProcedure);
        }

        public async Task<PagedResult<SubscriptionDto>> GetSubscriptionsAsync(
            PaginationParams pq,
            string? category = null,
            string? search = null,
            string? period = null,
            decimal? minPrice = null,
            decimal? maxPrice = null,
            string? orderBy = null,
            bool? descending = null)
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = "sp_Subscriptions_GetPagedExtended";
            var parameters = new DynamicParameters();
            parameters.Add("@PageNumber", pq.PageNumber);
            parameters.Add("@PageSize", pq.PageSize);
            parameters.Add("@Category", category);
            parameters.Add("@SearchTerm", search);
            parameters.Add("@Period", period);
            parameters.Add("@MinPrice", minPrice);
            parameters.Add("@MaxPrice", maxPrice);
            parameters.Add("@OrderBy", orderBy ?? "date");
            parameters.Add("@Descending", descending ?? true);
            parameters.Add("@TotalCount", dbType: DbType.Int32, direction: ParameterDirection.Output);

            var subscriptions = await connection.QueryAsync<Subscription>(sql, parameters, commandType: CommandType.StoredProcedure);
            var totalCount = parameters.Get<int>("@TotalCount");

            var dtos = _mapper.Map<IEnumerable<SubscriptionDto>>(subscriptions);

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

            return new PagedResult<SubscriptionDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = pq.PageNumber,
                PageSize = pq.PageSize
            };
        }
    }
}
