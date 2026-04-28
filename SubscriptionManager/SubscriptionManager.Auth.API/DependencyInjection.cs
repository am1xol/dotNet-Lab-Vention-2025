using SubscriptionManager.Auth.Infrastructure.Repositories;
using SubscriptionManager.Auth.Infrastructure.Services;
using SubscriptionManager.Auth.API.Services;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Options;
using SubscriptionManager.Infrastructure.Shared;
using System.Threading.RateLimiting;

namespace SubscriptionManager.Auth.API
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddAuthApiServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.ConfigureOptions(configuration);
            services.AddAuthProtection();
            services.AddSharedAuthentication(configuration);
            services.AddAuthDatabase(configuration);
            services.AddAuthApplicationServices();

            services.AddControllers();
            services.AddSignalR();
            services.AddEndpointsApiExplorer();
            services.AddSharedSwagger("Auth API");
            services.AddSharedHealthChecks(configuration);
            services.AddSharedObservability(configuration, "Auth.API");

            return services;
        }

        private static IServiceCollection AddAuthProtection(this IServiceCollection services)
        {
            services.AddMemoryCache();
            services.AddRateLimiter(options =>
            {
                options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

                options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
                {
                    var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown-ip";
                    return RateLimitPartition.GetSlidingWindowLimiter(
                        $"global:{ip}",
                        _ => new SlidingWindowRateLimiterOptions
                        {
                            PermitLimit = 120,
                            Window = TimeSpan.FromMinutes(1),
                            SegmentsPerWindow = 6,
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        });
                });

                options.AddPolicy("auth-login", context =>
                {
                    var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown-ip";
                    return RateLimitPartition.GetSlidingWindowLimiter(
                        $"auth-login:{ip}",
                        _ => new SlidingWindowRateLimiterOptions
                        {
                            PermitLimit = 10,
                            Window = TimeSpan.FromMinutes(1),
                            SegmentsPerWindow = 6,
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        });
                });

                options.AddPolicy("auth-sensitive", context =>
                {
                    var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown-ip";
                    return RateLimitPartition.GetSlidingWindowLimiter(
                        $"auth-sensitive:{ip}",
                        _ => new SlidingWindowRateLimiterOptions
                        {
                            PermitLimit = 6,
                            Window = TimeSpan.FromMinutes(1),
                            SegmentsPerWindow = 6,
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        });
                });
            });

            return services;
        }

        private static IServiceCollection ConfigureOptions(this IServiceCollection services, IConfiguration configuration)
        {
            services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
            services.Configure<PasswordHasherOptions>(configuration.GetSection(PasswordHasherOptions.SectionName));
            services.Configure<VerificationCodeOptions>(configuration.GetSection(VerificationCodeOptions.SectionName));
            services.Configure<EmailSettings>(configuration.GetSection(EmailSettings.SectionName));
            services.Configure<MinIOOptions>(configuration.GetSection(MinIOOptions.SectionName));
            services.Configure<ChatModerationOptions>(configuration.GetSection(ChatModerationOptions.SectionName));
            services.Configure<AuthSecurityOptions>(configuration.GetSection(AuthSecurityOptions.SectionName));

            return services;
        }

        private static IServiceCollection AddAuthDatabase(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddSingleton<IConfiguration>(configuration);
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
            services.AddSingleton<IAuthAttemptProtectionService, AuthAttemptProtectionService>();
            services.AddScoped<IChatRepository, ChatRepository>();
            services.AddScoped<IProfanityFilter, ProfanityFilter>();
            services.AddScoped<IFeedbackRepository, FeedbackRepository>();
            services.AddSingleton<IAdminSupportNotificationQueue, AdminSupportNotificationQueue>();
            services.AddHostedService<AdminSupportNotificationWorker>();

            return services;
        }
    }
}