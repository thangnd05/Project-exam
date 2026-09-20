export interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  message?: string;
}

export interface AuthMessageResponse {
  message?: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  userName: string;
  fullName: string;
  email?: string;
  password: string;
  recaptchaToken?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

export type ResetTokenInvalidReason = 'MISSING' | 'INVALID' | 'USED' | 'EXPIRED';

export interface ResetTokenStatus {
  valid: boolean;
  reason?: ResetTokenInvalidReason | null;
  maskedEmail?: string | null;
  expiresInSeconds?: number | null;
}
