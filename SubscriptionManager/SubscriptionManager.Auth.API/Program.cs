using SubscriptionManager.Auth.API;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthApiServices(builder.Configuration);

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

app.ConfigureAuthApi();

app.Run();