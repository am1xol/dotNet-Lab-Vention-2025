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
                    policy.WithOrigins("http://127.0.0.1:3000", "https://127.0.0.1:3000")
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials();
                });
            });
        }
    }
}
