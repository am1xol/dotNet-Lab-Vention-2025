using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Security.Cryptography;
using Microsoft.Extensions.Options;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Options;

namespace SubscriptionManager.Auth.Infrastructure.Services;

public class CustomPasswordHasher : IPasswordHasher
{
    private readonly PasswordHasherOptions _options;

    public CustomPasswordHasher(IOptions<PasswordHasherOptions> options)
    {
        _options = options.Value;
    }

    public string HashPassword(string password)
    {
        byte[] salt = new byte[_options.SaltSize];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(salt);

        byte[] hash = PBKDF2(password, salt, _options.Iterations, _options.HashSize);

        byte[] hashBytes = new byte[_options.SaltSize + _options.HashSize];
        Array.Copy(salt, 0, hashBytes, 0, _options.SaltSize);
        Array.Copy(hash, 0, hashBytes, _options.SaltSize, _options.HashSize);

        return Convert.ToBase64String(hashBytes);
    }

    public bool VerifyPassword(string password, string passwordHash)
    {
        byte[] hashBytes = Convert.FromBase64String(passwordHash);

        byte[] salt = new byte[_options.SaltSize];
        Array.Copy(hashBytes, 0, salt, 0, _options.SaltSize);

        byte[] originalHash = new byte[_options.HashSize];
        Array.Copy(hashBytes, _options.SaltSize, originalHash, 0, _options.HashSize);

        byte[] testHash = PBKDF2(password, salt, _options.Iterations, _options.HashSize);

        return SlowEquals(originalHash, testHash);
    }

    private static byte[] PBKDF2(string password, byte[] salt, int iterations, int outputBytes)
    {
        return Rfc2898DeriveBytes.Pbkdf2(
        password,
        salt,
        iterations,
        HashAlgorithmName.SHA256,
        outputBytes);
    }

    private static bool SlowEquals(byte[] a, byte[] b)
    {
        uint diff = (uint)a.Length ^ (uint)b.Length;
        for (int i = 0; i < a.Length && i < b.Length; i++)
        {
            diff |= (uint)(a[i] ^ b[i]);
        }
        return diff == 0;
    }
}
