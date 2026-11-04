import { apiClient } from './api';
import { College, AuthUser, StudentVerification } from '../types';

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  roll_number: string;
  department: string;
  year_of_study: number;
  id_card_image?: File | null;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}

export interface VerifyOTPResponse {
  message: string;
  access: string;
  refresh: string;
  user: AuthUser;
}

export const authService = {
  // 1. Get Active College
  async getActiveCollege(): Promise<College> {
    const res = await apiClient.get<College>('/api/v1/colleges/active/');
    return res.data;
  },

  // 2. Student Registration
  async register(data: RegisterPayload): Promise<{ message: string; email: string; college: string }> {
    const formData = new FormData();
    formData.append('full_name', data.full_name);
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('roll_number', data.roll_number);
    formData.append('department', data.department);
    formData.append('year_of_study', String(data.year_of_study));
    if (data.id_card_image) {
      formData.append('id_card_image', data.id_card_image);
    }

    const res = await apiClient.post('/api/v1/auth/register/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  // 3. Verify Email OTP
  async verifyEmail(email: string, otp: string): Promise<VerifyOTPResponse> {
    const res = await apiClient.post<VerifyOTPResponse>('/api/v1/auth/verify-email/', { email, otp });
    return res.data;
  },

  // 4. Resend OTP
  async resendOTP(email: string): Promise<{ message: string }> {
    const res = await apiClient.post('/api/v1/auth/resend-otp/', { email });
    return res.data;
  },

  // 5. Student / Admin Login
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await apiClient.post<LoginResponse>('/api/v1/auth/login/', { email, password });
    return res.data;
  },

  // 6. Logout
  async logout(refresh: string): Promise<{ message: string }> {
    const res = await apiClient.post('/api/v1/auth/logout/', { refresh });
    return res.data;
  },

  // 7. Verification Status
  async getVerificationStatus(email?: string): Promise<StudentVerification> {
    const res = await apiClient.get<StudentVerification>('/api/v1/profiles/verification-status/', {
      params: email ? { email } : {},
    });
    return res.data;
  },

  // 8. Resubmit Verification
  async resubmitVerification(formData: FormData): Promise<{ message: string; verification: StudentVerification }> {
    const res = await apiClient.post('/api/v1/profiles/verification/resubmit/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  // 9. Password Reset Request
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const res = await apiClient.post('/api/v1/auth/password-reset/', { email });
    return res.data;
  },

  // 10. Password Reset Confirm
  async confirmPasswordReset(email: string, otp: string, new_password: string): Promise<{ message: string }> {
    const res = await apiClient.post('/api/v1/auth/password-reset/confirm/', { email, otp, new_password });
    return res.data;
  },

  // 11. Admin: List Verifications
  async getAdminVerifications(status: string = 'PENDING'): Promise<StudentVerification[]> {
    const res = await apiClient.get<any>('/api/v1/admin/verifications/', {
      params: { status },
    });
    return Array.isArray(res.data) ? res.data : (res.data.results || []);
  },

  // 12. Admin: Approve Verification
  async approveVerification(id: string): Promise<{ message: string; verification: StudentVerification }> {
    const res = await apiClient.post(`/api/v1/admin/verifications/${id}/approve/`);
    return res.data;
  },

  // 13. Admin: Reject Verification
  async rejectVerification(id: string, reason: string): Promise<{ message: string; verification: StudentVerification }> {
    const res = await apiClient.post(`/api/v1/admin/verifications/${id}/reject/`, { reason });
    return res.data;
  },
};
