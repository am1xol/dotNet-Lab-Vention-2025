using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Options;
using SubscriptionManager.Infrastructure.Data;
using SubscriptionManager.Infrastructure.Repositories;
using SubscriptionManager.Infrastructure.Services;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Text;

namespace SubscriptionManager.Auth.API
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddAuthApiServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.ConfigureOptions(configuration);

            services.AddAuthAuthentication(configuration);

            services.AddAuthDatabase(configuration);

            services.AddAuthApplicationServices();

            services.AddAuthApiConfiguration();

            services.AddAuthHealthChecks(configuration);

            return services;
        }
        private static IServiceCollection ConfigureOptions(this IServiceCollection services, IConfiguration configuration)
        {
            services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
            services.Configure<PasswordHasherOptions>(configuration.GetSection(PasswordHasherOptions.SectionName));
            services.Configure<VerificationCodeOptions>(configuration.GetSection(VerificationCodeOptions.SectionName));
            services.Configure<EmailSettings>(configuration.GetSection(EmailSettings.SectionName));
            services.Configure<MinIOOptions>(configuration.GetSection(MinIOOptions.SectionName));

            return services;
        }
        private static IServiceCollection AddAuthAuthentication(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                var jwtOptions = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>();

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
        private static IServiceCollection AddAuthDatabase(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDbContext<AuthDbContext>(options =>
                options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

            return services;
        }
        private static IServiceCollection AddAuthApplicationServices(this IServiceCollection services)
        {
            services.AddScoped<IPasswordHasher, CustomPasswordHasher>();
            services.AddScoped<IUserRepository, UserRepository>();
            services.AddScoped<IVerificationCodeService, VerificationCodeService>();
            services.AddScoped<IEmailService, EmailService>();
            services.AddScoped<ITokenService, TokenService>();
            services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
            services.AddScoped<IAuthService, AuthService>();

            return services;
        }
        private static IServiceCollection AddAuthApiConfiguration(this IServiceCollection services)
        {
            services.AddControllers();
            services.AddProblemDetails();
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
        private static IServiceCollection AddAuthHealthChecks(this IServiceCollection services, IConfiguration configuration)
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

            return services;
        }
    }
}
