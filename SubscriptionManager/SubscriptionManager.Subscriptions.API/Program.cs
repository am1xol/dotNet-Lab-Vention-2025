using SubscriptionManager.Infrastructure.Services;
using SubscriptionManager.Subscriptions.API;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSubscriptionsApiServices(builder.Configuration);
builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();

var app = builder.Build();

await app.ApplyMigrationsAsync();

app.ConfigureSubscriptionsApi();

app.Run();