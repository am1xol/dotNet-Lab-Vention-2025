using SubscriptionManager.Subscriptions.API;
using SubscriptionManager.Infrastructure.Data;
using SubscriptionManager.Infrastructure.Shared;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSubscriptionsApiServices(builder.Configuration);

builder.Services.AddSharedCors(SharedConstants.CorsPolicy);

var app = builder.Build();

await app.ApplyMigrationsAsync<SubscriptionsDbContext>();

app.UseCors(SharedConstants.CorsPolicy);
app.ConfigureSubscriptionsApi();
app.Run();