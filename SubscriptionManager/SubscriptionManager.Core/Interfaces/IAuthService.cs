using SubscriptionManager.Core.Models.Requests;
using SubscriptionManager.Core.Models.Responses;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SubscriptionManager.Core.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResult> RegisterAsync(RegisterRequest request);
        Task<AuthResult> VerifyEmailAsync(VerifyEmailRequest request);
        Task<LoginResponse> LoginAsync(LoginRequest request);
        Task<RefreshTokenResponse> RefreshTokenAsync(RefreshTokenRequest request);
        Task<ForgotPasswordResponse> ForgotPasswordAsync(ForgotPasswordRequest request);
        Task<ForgotPasswordResponse> ResetPasswordAsync(ResetPasswordRequest request);
        Task<AuthResult> ResendVerificationCodeAsync(ResendVerificationCodeRequest request);
    }
}
