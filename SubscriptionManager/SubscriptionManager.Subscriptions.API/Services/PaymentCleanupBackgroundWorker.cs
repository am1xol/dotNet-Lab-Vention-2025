namespace SubscriptionManager.Subscriptions.API.Services
{
    public class PaymentCleanupBackgroundWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<PaymentCleanupBackgroundWorker> _logger;

        public PaymentCleanupBackgroundWorker(IServiceProvider serviceProvider, ILogger<PaymentCleanupBackgroundWorker> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var jobService = scope.ServiceProvider.GetRequiredService<IPaymentJobService>();
                    await jobService.CheckExpiringSubscriptionsAsync(stoppingToken);
                    await jobService.CleanupStuckPaymentsAsync(stoppingToken);
                }

                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }
    }
}
