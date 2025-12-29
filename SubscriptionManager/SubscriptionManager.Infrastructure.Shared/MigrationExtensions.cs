using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace SubscriptionManager.Infrastructure.Shared;

public static class MigrationExtensions
{
    public static async Task ApplyMigrationsAsync<TContext>(this IApplicationBuilder app)
        where TContext : DbContext
    {
        using var scope = app.ApplicationServices.CreateScope();
        var services = scope.ServiceProvider;

        try
        {
            var context = services.GetRequiredService<TContext>();
            await context.Database.MigrateAsync();
        }
        catch (Exception ex)
        {
            var logger = services.GetRequiredService<ILogger<TContext>>();
            logger.LogError(ex, "An error occurred while migrating the database for {ContextName}.", typeof(TContext).Name);
            throw;
        }
    }
}