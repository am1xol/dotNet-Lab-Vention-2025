using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SubscriptionManager.Core.Interfaces;

public interface IEmailService
{
    Task SendVerificationEmailAsync(string email, string verificationCode, string firstName);
    Task SendPasswordResetEmailAsync(string email, string resetCode, string firstName);
}