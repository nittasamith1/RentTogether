import { apiClient } from './api';

export interface DisputeItem {
  id: string;
  booking: string;
  booking_code: string;
  item_title: string;
  raised_by: string;
  raised_by_name: string;
  against_user: string;
  against_user_name: string;
  issue_type: 'DAMAGED_ITEM' | 'LATE_RETURN' | 'WRONG_ITEM' | 'NOT_RETURNED';
  description: string;
  evidence_image_urls: string[];
  claimed_compensation: string;
  status: 'OPEN' | 'UNDER_INVESTIGATION' | 'RESOLVED' | 'DISMISSED';
  resolution_decision?: 'FULL_REFUND_RENTER' | 'FORFEIT_DEPOSIT_TO_OWNER' | 'SPLIT';
  admin_notes?: string;
  resolved_by_name?: string;
  resolved_at?: string;
  created_at: string;
}

export interface PlatformAnalytics {
  users: {
    total_students: number;
    verified_students: number;
    verification_rate_pct: number;
    pending_verifications: number;
  };
  marketplace: {
    active_listings: number;
    total_listings: number;
    total_bookings: number;
    active_rentals: number;
    completed_rentals: number;
  };
  financials: {
    gross_merchandise_volume_inr: number;
    total_escrow_deposit_held_inr: number;
    platform_commission_earned_inr: number;
  };
  safety_and_disputes: {
    open_disputes: number;
    total_disputes: number;
    dispute_rate_pct: number;
  };
  colleges: Array<{
    id: string;
    name: string;
    code: string;
    student_count: number;
  }>;
  generated_at: string;
}

export interface StudentVerificationItem {
  id: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    is_college_verified: boolean;
  };
  college: {
    id: string;
    name: string;
    code: string;
  };
  roll_number: string;
  department: string;
  year_of_study: number;
  id_card_image?: string;
  id_card_url?: string;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejection_reason?: string;
  submitted_at: string;
}

export interface FraudAlertItem {
  id: string;
  risk_score: number;
  risk_tier: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING_REVIEW' | 'DISMISSED' | 'ACTION_TAKEN';
  signals: Record<string, any>;
  admin_notes: string;
  item_title?: string;
  user_email?: string;
  created_at: string;
}

export const adminService = {
  async getAnalytics(): Promise<PlatformAnalytics> {
    const res = await apiClient.get<PlatformAnalytics>('/api/v1/admin/platform-analytics/');
    return res.data;
  },

  async getDisputes(status?: string, search?: string): Promise<{ results: DisputeItem[]; count: number }> {
    const res = await apiClient.get<any>('/api/v1/admin/disputes/', {
      params: { status, search },
    });
    const results = Array.isArray(res.data) ? res.data : (res.data?.results || []);
    return { results, count: res.data?.count || results.length };
  },

  async resolveDispute(
    id: string,
    payload: {
      resolution_decision: 'FULL_REFUND_RENTER' | 'FORFEIT_DEPOSIT_TO_OWNER' | 'SPLIT';
      admin_notes: string;
      refund_amount?: number;
    }
  ): Promise<any> {
    const res = await apiClient.post(`/api/v1/admin/resolve-dispute/${id}/`, payload);
    return res.data;
  },

  async getPendingVerifications(status: string = 'PENDING', search?: string): Promise<StudentVerificationItem[]> {
    const res = await apiClient.get<any>('/api/v1/admin/pending-verifications/', {
      params: { status, search },
    });
    return Array.isArray(res.data) ? res.data : (res.data?.results || []);
  },

  async verifyStudent(
    id: string,
    action: 'APPROVE' | 'REJECT',
    rejection_reason?: string
  ): Promise<any> {
    const res = await apiClient.post(`/api/v1/admin/verify-student/${id}/`, {
      action,
      rejection_reason,
    });
    return res.data;
  },

  async getFraudAlerts(): Promise<FraudAlertItem[]> {
    const res = await apiClient.get<any>('/api/v1/admin/fraud-alerts/');
    return Array.isArray(res.data) ? res.data : (res.data?.results || []);
  },

  async reviewFraudAlert(id: string, status: 'DISMISSED' | 'ACTION_TAKEN', admin_notes: string): Promise<any> {
    const res = await apiClient.post(`/api/v1/admin/fraud-alerts/${id}/review/`, {
      status,
      admin_notes,
    });
    return res.data;
  },
};
