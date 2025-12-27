using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Options;
using SubscriptionManager.Infrastructure.Data;
using SubscriptionManager.Infrastructure.Services;
using SubscriptionManager.Subscriptions.API;
using System.Net.Http.Headers;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<BePaidOptions>(builder.Configuration.GetSection(BePaidOptions.SectionName));

builder.Services.AddHttpClient<IPaymentGatewayService, BePaidService>((serviceProvider, client) =>
{
    var options = serviceProvider.GetRequiredService<IOptions<BePaidOptions>>().Value;

    var authString = $"{options.ShopId}:{options.SecretKey}";
    var base64Auth = Convert.ToBase64String(Encoding.ASCII.GetBytes(authString));

    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", base64Auth);
    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
});

builder.Services.AddSubscriptionsApiServices(builder.Configuration);
builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddAutoMapper(cfg =>
{
    cfg.AddMaps(AppDomain.CurrentDomain.GetAssemblies());
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "https://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<SubscriptionsDbContext>();

        context.Database.Migrate();
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating the database.");
    }
}

await app.ApplyMigrationsAsync();

app.UseCors("AllowReactApp");

app.ConfigureSubscriptionsApi();

app.Run();