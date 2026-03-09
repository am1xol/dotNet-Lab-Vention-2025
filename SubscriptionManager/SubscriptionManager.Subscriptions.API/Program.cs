using SubscriptionManager.Infrastructure.Shared;
using SubscriptionManager.Subscriptions.API;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSubscriptionsApiServices(builder.Configuration);

builder.Services.AddSharedCors(SharedConstants.CorsPolicy);
builder.Services.AddSharedObservability(builder.Configuration, "Subscriptions.API");

var app = builder.Build();

app.UseCors(SharedConstants.CorsPolicy);
app.ConfigureSubscriptionsApi();

app.Run();