import { apiClient, ApiResponse } from './apiClient';
import { ENV } from '@/config/environment';

export interface EmailVerificationResponse extends ApiResponse {
  message?: string;
  nextStep?: string;
  verified?: boolean;
  expiresIn?: string;
}

export const emailVerificationApi = {
  // Verify email with code
  async verifyEmail(email: string, code: string, type: string): Promise<EmailVerificationResponse> {
    try {
      const response = await fetch(`${ENV.API_BASE_URL}/email-verification/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('auth-token') ? { Authorization: `Bearer ${localStorage.getItem('auth-token')}` } : {})
        },
        body: JSON.stringify({ email, code, type })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Verification failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  },

  // Resend verification code
  async resendCode(email: string, type: string): Promise<EmailVerificationResponse> {
    try {
      const response = await fetch(`${ENV.API_BASE_URL}/email-verification/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('auth-token') ? { Authorization: `Bearer ${localStorage.getItem('auth-token')}` } : {})
        },
        body: JSON.stringify({ email, type })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resend code');
      }

      return await response.json();
    } catch (error) {
      console.error('Resend code error:', error);
      throw error;
    }
  },

  // Request email change
  async requestEmailChange(newEmail: string): Promise<EmailVerificationResponse> {
    try {
      const response = await fetch(`${ENV.API_BASE_URL}/email-verification/request-email-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({ newEmail })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to request email change');
      }

      return await response.json();
    } catch (error) {
      console.error('Request email change error:', error);
      throw error;
    }
  },

  // Request password change verification
  async requestPasswordChange(): Promise<EmailVerificationResponse> {
    try {
      const response = await fetch(`${ENV.API_BASE_URL}/email-verification/request-password-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to request password change');
      }

      return await response.json();
    } catch (error) {
      console.error('Request password change error:', error);
      throw error;
    }
  }
};