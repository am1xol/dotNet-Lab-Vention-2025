using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SubscriptionManager.Core;
using SubscriptionManager.Core.DTOs;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Options;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SubscriptionManager.Infrastructure.Services
{
    public class BePaidService : IPaymentGatewayService
    {
        private readonly HttpClient _httpClient;
        private readonly BePaidOptions _options;
        private readonly ILogger<BePaidService> _logger;

        private const string ApiVersion = "2.1";
        private const string TransactionType = "payment";

        public BePaidService(HttpClient httpClient, IOptions<BePaidOptions> options, ILogger<BePaidService> logger)
        {
            _httpClient = httpClient;
            _options = options.Value;
            _logger = logger;
        }

        public async Task<PaymentInitiationResult> InitiatePaymentAsync(decimal amount, string currency, string description, string trackingId, string email, DateTime? expiredAt = null)
        {
            var request = new BePaidCheckoutRequest
            {
                Checkout = new CheckoutData
                {
                    Test = _options.TestMode,
                    TransactionType = TransactionType,
                    Version = ApiVersion,
                    Order = new OrderData
                    {
                        Amount = ConvertToCopies(amount), 
                        Currency = currency,
                        Description = description,
                        TrackingId = trackingId,
                        ExpiredAt = expiredAt?.ToString("yyyy-MM-ddTHH:mm:ssK")
                    },
                    Settings = new SettingsData
                    {
                        SuccessUrl = _options.ReturnUrl,
                        FailUrl = _options.ReturnUrl,
                        NotificationUrl = _options.NotificationUrl
                    },
                    Customer = new CustomerData
                    {
                        Email = email
                    }
                }
            };

            if (_logger.IsEnabled(LogLevel.Information))
            {
                var jsonDebug = JsonSerializer.Serialize(request, new JsonSerializerOptions { WriteIndented = true });
                _logger.LogInformation("Sending BePaid Checkout Request: {Request}", jsonDebug);
            }

            var response = await _httpClient.PostAsJsonAsync(_options.ApiUrl, request);

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

        private long ConvertToCopies(decimal amount)
        {
            return (long)(amount * 100);
        }

        public async Task<PaymentStatus?> CheckPaymentStatusAsync(string trackingId)
        {
            try
            {                
                var response = await _httpClient.GetAsync($"https://api.bepaid.by/beyag/transactions/tracking_id/{trackingId}");
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Error checking bePaid status: {StatusCode}", response.StatusCode);
                    return null;
                }

                var result = await response.Content.ReadFromJsonAsync<BePaidTrackingResponse>();
                
                var transaction = result?.Transactions?.OrderByDescending(t => t.CreatedAt).FirstOrDefault();

                if (transaction == null) return null;

                return transaction.Status switch
                {
                    "successful" => PaymentStatus.Completed,
                    "failed" => PaymentStatus.Failed,
                    "error" => PaymentStatus.Failed,
                    "expired" => PaymentStatus.Failed,
                    "pending" => PaymentStatus.Pending,
                    _ => PaymentStatus.Pending
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception while checking bePaid status");
                return null;
            }
        }

        private class BePaidTrackingResponse
        {
            [JsonPropertyName("transactions")]
            public List<BePaidTransactionInfo>? Transactions { get; set; }
        }

        private class BePaidTransactionInfo
        {
            [JsonPropertyName("status")]
            public string Status { get; set; } = string.Empty;

            [JsonPropertyName("created_at")]
            public DateTime CreatedAt { get; set; }
        }
    }
}