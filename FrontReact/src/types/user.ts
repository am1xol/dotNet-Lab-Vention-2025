import { User } from './auth';

export type UserProfile = User;

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  email: string;
  subscriptionExpiryReminderDays: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}
