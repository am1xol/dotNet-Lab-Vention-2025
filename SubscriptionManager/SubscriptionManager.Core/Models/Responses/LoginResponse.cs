using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SubscriptionManager.Core.Models.Responses;

public class LoginResponse
{
    public bool Success { get; set; }
    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime AccessTokenExpiresAt { get; set; }
    public List<string> Errors { get; set; } = new();
}
