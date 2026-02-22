export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResult {
  userId?: string;
  error?: string;
}

export interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: string;
  error?: string;
}

export interface RefreshTokenResponse {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: string;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  role: string;
  createdAt: string;
}

export interface VerifyEmailRequest {
  email: string;
  verificationCode: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  resetToken: string;
  newPassword: string;
}

export interface ForgotPasswordResponse {
  message?: string;
  error?: string;
}

export interface ResendVerificationCodeRequest {
  email: string;
}
