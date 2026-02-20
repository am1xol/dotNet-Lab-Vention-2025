using Microsoft.EntityFrameworkCore;
using SubscriptionManager.Auth.Infrastructure.Data;
using SubscriptionManager.Auth.Infrastructure.Repositories;
using SubscriptionManager.Auth.Infrastructure.Services;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Options;
using SubscriptionManager.Infrastructure.Shared;

namespace SubscriptionManager.Auth.API
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddAuthApiServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.ConfigureOptions(configuration);
            services.AddSharedAuthentication(configuration);
            services.AddAuthDatabase(configuration);
            services.AddAuthApplicationServices();

            services.AddControllers();
            services.AddEndpointsApiExplorer();
            services.AddSharedSwagger("Auth API");

            services.AddSharedHealthChecks(configuration);

            services.AddSharedObservability(configuration, "Auth.API");

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
    }
}