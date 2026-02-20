using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using OpenTelemetry.Logs;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using System.Text;

namespace SubscriptionManager.Infrastructure.Shared
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddSharedObservability(this IServiceCollection services, IConfiguration configuration, string serviceName)
        {
            var otelEndpoint = configuration["OTEL_EXPORTER_OTLP_ENDPOINT"] ?? "http://localhost:4317";

            services.AddOpenTelemetry()
                .WithTracing(tracing => tracing
                    .AddSource(serviceName)
                    .SetResourceBuilder(ResourceBuilder.CreateDefault().AddService(serviceName))
                    .AddAspNetCoreInstrumentation()
                    .AddHttpClientInstrumentation()
                    .AddSqlClientInstrumentation()
                    .AddEntityFrameworkCoreInstrumentation()
                    .AddOtlpExporter(opt => { opt.Endpoint = new Uri(otelEndpoint); opt.Protocol = OpenTelemetry.Exporter.OtlpExportProtocol.Grpc; }))
                .WithMetrics(metrics => metrics
                    .SetResourceBuilder(ResourceBuilder.CreateDefault().AddService(serviceName))
                    .AddAspNetCoreInstrumentation()
                    .AddHttpClientInstrumentation()
                    .AddRuntimeInstrumentation()
                    .AddOtlpExporter(opt => { opt.Endpoint = new Uri(otelEndpoint); opt.Protocol = OpenTelemetry.Exporter.OtlpExportProtocol.Grpc; }));

            services.AddLogging(logging => logging.AddOpenTelemetry(opt =>
            {
                opt.IncludeFormattedMessage = true;
                opt.IncludeScopes = true;
                opt.SetResourceBuilder(ResourceBuilder.CreateDefault().AddService(serviceName));
                opt.AddOtlpExporter(otlp => { otlp.Endpoint = new Uri(otelEndpoint); otlp.Protocol = OpenTelemetry.Exporter.OtlpExportProtocol.Grpc; });
            }));

            return services;
        }

        public static IServiceCollection AddSharedSwagger(this IServiceCollection services, string apiTitle)
        {
            services.AddSwaggerGen(options =>
            {
                options.SwaggerDoc("v1", new OpenApiInfo { Title = apiTitle, Version = "v1" });

                var schemeName = "Bearer";
                options.AddSecurityDefinition(schemeName, new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Description = "Введите только JWT токен",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer",
                    BearerFormat = "JWT"
                });

                options.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = schemeName }
                    },
                    Array.Empty<string>()
                }
            });
            });
            return services;
        }

        public static IServiceCollection AddSharedAuthentication(this IServiceCollection services, IConfiguration configuration)
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
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Secret"]!))
                    };
                });
            return services;
        }

        public static IServiceCollection AddSharedHealthChecks(this IServiceCollection services, IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            if (string.IsNullOrEmpty(connectionString))
                throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

            services.AddHealthChecks()
                .AddSqlServer(
                    connectionString: connectionString,
                    name: "sqlserver",
                    tags: new[] { "database", "sql" }
                );

            return services;
        }
    }
}
