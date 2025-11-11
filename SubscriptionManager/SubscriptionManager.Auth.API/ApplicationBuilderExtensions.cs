using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using SubscriptionManager.Infrastructure.Data;

namespace SubscriptionManager.Auth.API
{
    public static class ApplicationBuilderExtensions
    {
        public static WebApplication ConfigureAuthApi(this WebApplication app)
        {
            if (app.Environment.IsDevelopment())
            {
                app.ConfigureDevelopmentEnvironment();
            }

            app.ConfigureMiddleware();

            app.ConfigureEndpoints();

            return app;
        }
        private static WebApplication ConfigureDevelopmentEnvironment(this WebApplication app)
        {
            app.UseSwagger();
            app.UseSwaggerUI(options =>
            {
                options.SwaggerEndpoint("/swagger/v1/swagger.json", "Auth API V1");
                options.RoutePrefix = "swagger";
            });

            return app;
        }

        private static WebApplication ConfigureMiddleware(this WebApplication app)
        {
            app.UseAuthentication();
            app.UseAuthorization();

            return app;
        }

        private static WebApplication ConfigureEndpoints(this WebApplication app)
        {
            app.MapControllers();
            app.ConfigureHealthChecks();

            return app;
        }
        private static WebApplication ConfigureHealthChecks(this WebApplication app)
        {
            app.MapHealthChecks("/health", new HealthCheckOptions
            {
                ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse,
                Predicate = _ => true
            });

            app.MapHealthChecks("/health/ready", new HealthCheckOptions
            {
                ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse,
                Predicate = check => check.Tags.Contains("database")
            });

            app.MapHealthChecks("/health/live", new HealthCheckOptions
            {
                ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse,
                Predicate = check => !check.Tags.Contains("database")
            });

            return app;
        }
        public static async Task ApplyMigrationsAsync(this WebApplication app)
        {
            using var scope = app.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            try
            {
                await dbContext.Database.MigrateAsync();
                Console.WriteLine("Migrations applied successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Migrations warning: {ex.Message}");
            }
        }
    }
}
