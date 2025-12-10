using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace SubscriptionManager.Core.DTOs
{
    public class PaymentInitiationResult
    {
        public string RedirectUrl { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
    }

    public class BePaidCheckoutRequest
    {
        [JsonPropertyName("checkout")]
        public CheckoutData Checkout { get; set; } = new();
    }

    public class CheckoutData
    {
        [JsonPropertyName("test")]
        public bool Test { get; set; }

        [JsonPropertyName("transaction_type")]
        public string TransactionType { get; set; } = "payment";

        [JsonPropertyName("version")]
        public double Version { get; set; } = 2.1;

        [JsonPropertyName("order")]
        public OrderData Order { get; set; } = new();

        [JsonPropertyName("settings")]
        public SettingsData Settings { get; set; } = new();

        [JsonPropertyName("customer")]
        public CustomerData Customer { get; set; } = new();
    }

    public class OrderData
    {
        [JsonPropertyName("amount")]
        public long Amount { get; set; }

        [JsonPropertyName("currency")]
        public string Currency { get; set; } = "BYN";

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("tracking_id")]
        public string TrackingId { get; set; } = string.Empty;
    }

    public class SettingsData
    {
        [JsonPropertyName("success_url")]
        public string SuccessUrl { get; set; } = string.Empty;

        [JsonPropertyName("fail_url")]
        public string FailUrl { get; set; } = string.Empty;

        [JsonPropertyName("notification_url")]
        public string NotificationUrl { get; set; } = string.Empty;
    }

    public class CustomerData
    {
        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;
    }

    public class BePaidWebhookModel
    {
        [JsonPropertyName("transaction")]
        public TransactionData Transaction { get; set; } = new();
    }

    public class TransactionData
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("amount")]
        public long Amount { get; set; }

        [JsonPropertyName("tracking_id")]
        public string TrackingId { get; set; } = string.Empty; 

        [JsonPropertyName("payment_method_type")]
        public string PaymentMethodType { get; set; } = string.Empty;

        [JsonPropertyName("credit_card")]
        public CreditCardData? CreditCard { get; set; }
    }

    public class CreditCardData
    {
        [JsonPropertyName("last_4")]
        public string Last4 { get; set; } = string.Empty;

        [JsonPropertyName("brand")]
        public string Brand { get; set; } = string.Empty;
    }
}
