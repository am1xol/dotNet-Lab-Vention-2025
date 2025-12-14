using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SubscriptionManager.Core.DTOs;
using SubscriptionManager.Core.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace SubscriptionManager.Infrastructure.Services
{
    public class BePaidService : IPaymentGatewayService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<BePaidService> _logger;

        public BePaidService(HttpClient httpClient, IConfiguration configuration, ILogger<BePaidService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;

            var shopId = _configuration["BePaid:ShopId"];
            var secretKey = _configuration["BePaid:SecretKey"];
            var authHeader = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{shopId}:{secretKey}"));
            _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", authHeader);
        }

        public async Task<PaymentInitiationResult> InitiatePaymentAsync(decimal amount, string currency, string description, string trackingId, string email)
        {
            var request = new BePaidCheckoutRequest
            {
                Checkout = new CheckoutData
                {
                    Test = _configuration.GetValue<bool>("BePaid:TestMode"),
                    TransactionType = "payment",
                    Version = "2.1",
                    Order = new OrderData
                    {
                        Amount = (long)(amount * 100),
                        Currency = currency,
                        Description = description,
                        TrackingId = trackingId
                    },
                    Settings = new SettingsData
                    {
                        SuccessUrl = _configuration["BePaid:ReturnUrl"]!,
                        FailUrl = _configuration["BePaid:ReturnUrl"]!,
                        NotificationUrl = _configuration["BePaid:NotificationUrl"]!
                    },
                    Customer = new CustomerData
                    {
                        Email = email
                    }
                }
            };

            var jsonRequest = JsonSerializer.Serialize(request, new JsonSerializerOptions { WriteIndented = true });
            _logger.LogInformation("Sending BePaid Checkout Request: {Request}", jsonRequest);

            var response = await _httpClient.PostAsJsonAsync("https://checkout.bepaid.by/ctp/api/checkouts", request);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                throw new ArgumentException($"BePaid service responded with error: {errorContent}");
            }

            var jsonResponse = await response.Content.ReadFromJsonAsync<JsonElement>();

            if (jsonResponse.TryGetProperty("checkout", out var checkoutProp))
            {
                return new PaymentInitiationResult
                {
                    RedirectUrl = checkoutProp.GetProperty("redirect_url").GetString()!,
                    Token = checkoutProp.GetProperty("token").GetString()!
                };
            }

            throw new Exception("Invalid response from bePaid");
        }
    }
}
