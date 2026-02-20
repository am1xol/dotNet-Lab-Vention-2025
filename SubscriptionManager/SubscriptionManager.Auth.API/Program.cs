using SubscriptionManager.Auth.API;
using SubscriptionManager.Auth.Infrastructure.Data;
using SubscriptionManager.Infrastructure.Shared;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthApiServices(builder.Configuration);
builder.Services.AddHttpContextAccessor();

builder.Services.AddSharedCors(SharedConstants.CorsPolicy);

builder.Services.AddSharedObservability(builder.Configuration, "Auth.API");

var app = builder.Build();

await app.ApplyMigrationsAsync<AuthDbContext>();

app.UseCors(SharedConstants.CorsPolicy);
app.ConfigureAuthApi();
app.Run();