using SubscriptionManager.Auth.API;
using SubscriptionManager.Infrastructure.Shared;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthApiServices(builder.Configuration);
builder.Services.AddHttpContextAccessor();

builder.Services.AddSharedCors(SharedConstants.CorsPolicy);

builder.Services.AddSharedObservability(builder.Configuration, "Auth.API");

var app = builder.Build();

app.UseCors(SharedConstants.CorsPolicy);
app.ConfigureAuthApi();
app.Run();