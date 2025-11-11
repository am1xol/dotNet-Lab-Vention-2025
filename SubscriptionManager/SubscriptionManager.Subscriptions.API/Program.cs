using SubscriptionManager.Subscriptions.API;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSubscriptionsApiServices(builder.Configuration);

var app = builder.Build();

await app.ApplyMigrationsAsync();

app.ConfigureSubscriptionsApi();

app.Run();