namespace SubscriptionManager.Core.Interfaces;

public interface IVerificationCodeService
{
    string GenerateCode();
    DateTime GetExpirationTime();
}
