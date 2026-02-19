using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Options;
using SubscriptionManager.Subscriptions.Infrastructure.Data;
using SubscriptionManager.Subscriptions.Infrastructure.Services;
using SubscriptionManager.Subscriptions.API.Services;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Net.Http.Headers;
using System.Text;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using OpenTelemetry.Logs;
using Microsoft.OpenApi.Models;
using SubscriptionManager.Auth.Infrastructure.Data;
using SubscriptionManager.Auth.Infrastructure.Services;

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
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Subscriptions API",
                Version = "v1"
            });

            const string schemeName = "Bearer";

            // Определение схемы
            var securityScheme = new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Description = "Введите только JWT токен",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT"
            };

            options.AddSecurityDefinition(schemeName, securityScheme);

            // Определение требования
            var securityRequirement = new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = schemeName
                }
            },
            Array.Empty<string>()
        }
    };

            options.AddSecurityRequirement(securityRequirement);
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

        public static IServiceCollection AddObservability(this IServiceCollection services, IConfiguration configuration, string serviceName)
        {
            services.AddOpenTelemetry()
                .WithTracing(tracing =>
                {
                    tracing.AddSource(serviceName)
                        .SetResourceBuilder(ResourceBuilder.CreateDefault().AddService(serviceName))
                        .AddAspNetCoreInstrumentation()
                        .AddHttpClientInstrumentation()
                        .AddSqlClientInstrumentation()
                        .AddEntityFrameworkCoreInstrumentation()
                        .AddOtlpExporter(options =>
                        {
                            options.Endpoint = new Uri(configuration["OTEL_EXPORTER_OTLP_ENDPOINT"] ?? "http://localhost:4317");
                            options.Protocol = OpenTelemetry.Exporter.OtlpExportProtocol.Grpc;
                        });
                })
                .WithMetrics(metrics =>
                {
                    metrics.SetResourceBuilder(ResourceBuilder.CreateDefault().AddService(serviceName))
                        .AddAspNetCoreInstrumentation()
                        .AddHttpClientInstrumentation()
                        .AddRuntimeInstrumentation()
                        .AddOtlpExporter(options =>
                        {
                            options.Endpoint = new Uri(configuration["OTEL_EXPORTER_OTLP_ENDPOINT"] ?? "http://localhost:4317");
                            options.Protocol = OpenTelemetry.Exporter.OtlpExportProtocol.Grpc;
                        });
                });

            services.AddLogging(logging =>
            {
                logging.AddOpenTelemetry(options =>
                {
                    options.IncludeFormattedMessage = true;
                    options.IncludeScopes = true;

                    options.SetResourceBuilder(ResourceBuilder.CreateDefault().AddService(serviceName));
                    options.AddOtlpExporter(otlpOptions =>
                    {
                        otlpOptions.Endpoint = new Uri(configuration["OTEL_EXPORTER_OTLP_ENDPOINT"] ?? "http://localhost:4317");
                        otlpOptions.Protocol = OpenTelemetry.Exporter.OtlpExportProtocol.Grpc;
                    });
                });
            });

            return services;
        }
    }
}
