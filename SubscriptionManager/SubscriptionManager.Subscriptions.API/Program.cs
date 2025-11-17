using SubscriptionManager.Infrastructure.Services;
using SubscriptionManager.Subscriptions.API;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSubscriptionsApiServices(builder.Configuration);
builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();

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

await app.ApplyMigrationsAsync();

app.UseCors("AllowReactApp");

app.ConfigureSubscriptionsApi();

app.Run();