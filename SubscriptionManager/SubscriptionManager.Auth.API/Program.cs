using SubscriptionManager.Auth.API;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthApiServices(builder.Configuration);

var app = builder.Build();

await app.ApplyMigrationsAsync();

app.ConfigureAuthApi();

app.Run();