using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SubscriptionManager.Auth.Infrastructure.Data;
using SubscriptionManager.Auth.Infrastructure.Services;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Options;
using SubscriptionManager.Infrastructure.Shared;
using SubscriptionManager.Subscriptions.API.Services;
using SubscriptionManager.Subscriptions.Infrastructure.Data;
using SubscriptionManager.Subscriptions.Infrastructure.Services;
using System.Net.Http.Headers;
using System.Text;

namespace SubscriptionManager.Subscriptions.API
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddSubscriptionsApiServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.ConfigureOptions(configuration);

            services.AddSharedAuthentication(configuration);
            services.AddSharedObservability(configuration, "Subscriptions.API");
            services.AddSharedHealthChecks(configuration);
            services.AddSharedSwagger("Subscriptions API");

            services.AddSubscriptionsDatabase(configuration);
            services.AddSubscriptionsApplicationServices(configuration);

            services.AddControllers();
            services.AddEndpointsApiExplorer();
            services.AddAutoMapper(cfg => cfg.AddMaps(AppDomain.CurrentDomain.GetAssemblies()));

            return services;
        }

        private static IServiceCollection ConfigureOptions(this IServiceCollection services, IConfiguration configuration)
        {
            services.Configure<MinIOOptions>(configuration.GetSection(MinIOOptions.SectionName));
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
    }
}