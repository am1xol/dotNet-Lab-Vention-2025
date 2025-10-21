using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SubscriptionManager.Core.Interfaces;

namespace SubscriptionManager.Infrastructure.Services;

public class VerificationCodeService : IVerificationCodeService
{
    private const int CODE_LENGTH = 6;
    private const int EXPIRATION_HOURS = 24;

    public string GenerateCode()
    {
        var random = new Random();
        var code = random.Next(100000, 999999).ToString();
        return code;
    }

    public DateTime GetExpirationTime()
    {
        return DateTime.UtcNow.AddHours(EXPIRATION_HOURS);
    }
}