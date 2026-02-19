using SubscriptionManager.Subscriptions.API;
using SubscriptionManager.Subscriptions.Infrastructure.Data;
using SubscriptionManager.Infrastructure.Shared;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSubscriptionsApiServices(builder.Configuration);

builder.Services.AddSharedCors(SharedConstants.CorsPolicy);

builder.Services.AddObservability(builder.Configuration, "Subscriptions.API");

var app = builder.Build();

await app.ApplyMigrationsAsync<SubscriptionsDbContext>();

app.UseCors(SharedConstants.CorsPolicy);
app.ConfigureSubscriptionsApi();
app.Run();