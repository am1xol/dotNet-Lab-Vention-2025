using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Options;
using SubscriptionManager.Infrastructure.Data;
using SubscriptionManager.Infrastructure.Services;
using SubscriptionManager.Subscriptions.API.Services;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Net.Http.Headers;
using System.Text;

namespace SubscriptionManager.Subscriptions.API
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddSubscriptionsApiServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.ConfigureOptions(configuration);
            services.AddSubscriptionsAuthentication(configuration);
            services.AddSubscriptionsDatabase(configuration);

            services.AddSubscriptionsApplicationServices(configuration);

            services.AddSubscriptionsApiConfiguration();
            services.AddSubscriptionsHealthChecks(configuration);

            services.AddAutoMapper(cfg => cfg.AddMaps(AppDomain.CurrentDomain.GetAssemblies()));

            return services;
        }
        private static IServiceCollection ConfigureOptions(this IServiceCollection services, IConfiguration configuration)
        {
            services.Configure<MinIOOptions>(configuration.GetSection(MinIOOptions.SectionName));
            return services;
        }
        private static IServiceCollection AddSubscriptionsAuthentication(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = configuration["Jwt:Issuer"],
                        ValidAudience = configuration["Jwt:Audience"],
                        IssuerSigningKey = new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(configuration["Jwt:Secret"]!))
                    };
                });

            return services;
        }
        private static IServiceCollection AddSubscriptionsDatabase(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDbContext<SubscriptionsDbContext>(options =>
                options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

            services.AddDbContext<AuthDbContext>(options =>
                options.UseSqlServer(configuration.GetConnectionString("AuthConnection")));

            return services;
        }

        private static IServiceCollection AddSubscriptionsApplicationServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddScoped<ISubscriptionService, SubscriptionService>();
            services.AddScoped<IFileStorageService, FileStorageService>();

            services.AddScoped<INotificationService, NotificationService>();

            services.AddScoped<IPaymentJobService, PaymentJobService>();
            services.AddHostedService<PaymentCleanupBackgroundWorker>();

            services.Configure<BePaidOptions>(configuration.GetSection(BePaidOptions.SectionName));
            services.AddHttpClient<IPaymentGatewayService, BePaidService>((serviceProvider, client) =>
            {
                var options = serviceProvider.GetRequiredService<IOptions<BePaidOptions>>().Value;
                var authString = $"{options.ShopId}:{options.SecretKey}";
                var base64Auth = Convert.ToBase64String(Encoding.ASCII.GetBytes(authString));

                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", base64Auth);
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            });

            services.Configure<EmailSettings>(configuration.GetSection("EmailSettings"));
            services.AddScoped<IEmailService, EmailService>();

            return services;
        }

        private static IServiceCollection AddSubscriptionsApiConfiguration(this IServiceCollection services)
        {
            services.AddControllers();
            services.AddEndpointsApiExplorer();
            services.AddSwaggerGen(ConfigureSwagger);

            return services;
        }
        private static void ConfigureSwagger(SwaggerGenOptions options)
        {
            options.SwaggerDoc("v1", new OpenApiInfo { Title = "Subscriptions API", Version = "v1" });

            const string schemeName = "Bearer";

            options.AddSecurityDefinition(schemeName, new OpenApiSecurityScheme
            {
                Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
                Name = "Authorization",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.ApiKey,
                Scheme = "Bearer"
            });

            options.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecuritySchemeReference(schemeName),
                    new List<string>()
                }
            });
        }
        private static IServiceCollection AddSubscriptionsHealthChecks(this IServiceCollection services, IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            if (string.IsNullOrEmpty(connectionString))
            {
                throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
            }

            services.AddHealthChecks()
                .AddSqlServer(
                    connectionString: connectionString,
                    name: "sqlserver",
                    tags: new[] { "database", "sql" }
                );

            services.AddScoped<IFileStorageService, FileStorageService>();

            return services;
        }
    }
}
