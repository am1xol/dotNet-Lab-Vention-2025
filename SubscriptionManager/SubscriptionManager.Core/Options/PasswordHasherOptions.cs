namespace SubscriptionManager.Core.Options;

public class PasswordHasherOptions
{
    public const string SectionName = "PasswordHasher";

    public int SaltSize { get; set; } = 16;
    public int HashSize { get; set; } = 32;
    public int Iterations { get; set; } = 10000;
}
