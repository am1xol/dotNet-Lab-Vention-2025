using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SubscriptionManager.Core.DTOs;

namespace SubscriptionManager.Core.Interfaces
{
    public interface IPaymentGatewayService
    {
        Task<PaymentInitiationResult> InitiatePaymentAsync(decimal amount, string currency, string description, string trackingId, string email);
    }
}
