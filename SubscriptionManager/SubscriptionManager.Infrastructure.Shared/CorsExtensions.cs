using Microsoft.Extensions.DependencyInjection;

namespace SubscriptionManager.Infrastructure.Shared
{
    public static class CorsExtensions
    {
        public static IServiceCollection AddSharedCors(this IServiceCollection services, string policyName)
        {
            return services.AddCors(options =>
            {
                options.AddPolicy(policyName, policy =>
                {
                    policy.WithOrigins("http://localhost:3000", "https://localhost:3000")
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials();
                });
            });
        }
    }
}
