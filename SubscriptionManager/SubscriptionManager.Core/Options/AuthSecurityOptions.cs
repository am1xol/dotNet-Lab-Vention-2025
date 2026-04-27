namespace SubscriptionManager.Core.Options;

public class AuthSecurityOptions
{
    public const string SectionName = "AuthSecurity";

    public int LoginMaxFailures { get; set; } = 5;
    public int VerificationMaxFailures { get; set; } = 5;
    public int PasswordResetMaxFailures { get; set; } = 5;
    public int WindowMinutes { get; set; } = 10;
    public int BaseLockoutSeconds { get; set; } = 30;
    public int MaxLockoutMinutes { get; set; } = 30;
}
