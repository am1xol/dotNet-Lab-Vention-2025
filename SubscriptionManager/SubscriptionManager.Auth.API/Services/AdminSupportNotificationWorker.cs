using SubscriptionManager.Core.Constants;
using SubscriptionManager.Core.Interfaces;

namespace SubscriptionManager.Auth.API.Services;

public class AdminSupportNotificationWorker : BackgroundService
{
    private readonly IAdminSupportNotificationQueue _queue;
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly ILogger<AdminSupportNotificationWorker> _logger;

    public AdminSupportNotificationWorker(
        IAdminSupportNotificationQueue queue,
        IServiceScopeFactory serviceScopeFactory,
        ILogger<AdminSupportNotificationWorker> logger)
    {
        _queue = queue;
        _serviceScopeFactory = serviceScopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var job in _queue.DequeueAllAsync(stoppingToken))
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var userRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();
                var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

                var users = await userRepository.GetAllUsersAsync();
                var adminEmails = users
                    .Where(u => u.Role == RoleConstants.Admin && !string.IsNullOrWhiteSpace(u.Email))
                    .Select(u => u.Email)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                if (adminEmails.Count == 0)
                {
                    _logger.LogWarning("Support message email notification skipped: no admin emails found.");
                    continue;
                }

                var title = "Новое сообщение в чате поддержки";
                var trimmedMessage = job.MessageContent.Length > 500
                    ? $"{job.MessageContent[..500]}..."
                    : job.MessageContent;
                var body = $"""
                    Пользователь отправил новое сообщение в чате поддержки.

                    ID пользователя: {job.SenderUserId}
                    Сообщение:
                    {trimmedMessage}
                    """;

                foreach (var adminEmail in adminEmails)
                {
                    await emailService.SendNotificationEmailAsync(adminEmail, title, body);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process support chat email notification job.");
            }
        }
    }
}
