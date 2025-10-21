using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SubscriptionManager.Core.Interfaces;

public interface IVerificationCodeService
{
    string GenerateCode();
    DateTime GetExpirationTime();
}
