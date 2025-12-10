using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SubscriptionManager.Core.Options;
using SubscriptionManager.Infrastructure.Data;
using SubscriptionManager.Infrastructure.Services;
using Swashbuckle.AspNetCore.SwaggerGen;
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

            services.AddSubscriptionsApplicationServices();

            services.AddSubscriptionsApiConfiguration();

            services.AddSubscriptionsHealthChecks(configuration);

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

            return services;
        }

        private static IServiceCollection AddSubscriptionsApplicationServices(this IServiceCollection services)
        {
            services.AddScoped<IFileStorageService, FileStorageService>();
            services.AddHttpClient<Core.Interfaces.IPaymentGatewayService, Infrastructure.Services.BePaidService>();
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

            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
                Name = "Authorization",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.ApiKey,
                Scheme = "Bearer"
            });

            options.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                new string[] {}
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
