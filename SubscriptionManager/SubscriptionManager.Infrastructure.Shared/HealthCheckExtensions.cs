using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Routing;

namespace SubscriptionManager.Infrastructure.Shared
{
    public static class HealthCheckExtensions
    {
        public static IEndpointRouteBuilder MapSharedHealthChecks(this IEndpointRouteBuilder endpoints)
        {
            endpoints.MapHealthChecks("/health", new HealthCheckOptions
            {
                ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse,
                Predicate = _ => true
            });

            endpoints.MapHealthChecks("/health/ready", new HealthCheckOptions
            {
                ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse,
                Predicate = check => check.Tags.Contains("database")
            });

            endpoints.MapHealthChecks("/health/live", new HealthCheckOptions
            {
                ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse,
                Predicate = check => !check.Tags.Contains("database")
            });

            return endpoints;
        }
    }
}
