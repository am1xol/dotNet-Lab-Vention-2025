using SubscriptionManager.Auth.API;
using SubscriptionManager.Infrastructure.Data;
using SubscriptionManager.Infrastructure.Shared;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthApiServices(builder.Configuration);
builder.Services.AddHttpContextAccessor();

builder.Services.AddCors(options =>
{
    options.AddPolicy(SharedConstants.CorsPolicy, policy =>
    {
        policy.WithOrigins("http://localhost:3000", "https://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

await app.ApplyMigrationsAsync<AuthDbContext>();

app.UseCors(SharedConstants.CorsPolicy);
app.ConfigureAuthApi();
app.Run();