using SubscriptionManager.Infrastructure.Shared;

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
            app.MapSharedHealthChecks();

            return app;
        }
    }
}
