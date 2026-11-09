import { apiClient } from './api';

export interface BookingSummary {
  id: string;
  booking_code: string;
  booking_reference: string;
  item_id: string;
  item_title: string;
  item_thumbnail: string | null;
  owner_id: string;
  owner_name: string;
  renter_id: string;
  renter_name: string;
  user_role: 'OWNER' | 'RENTER' | 'VIEWER';
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  start_datetime?: string | null;
  end_datetime?: string | null;
  total_days: number;
  total_duration_hours?: string;
  daily_rate: string;
  hourly_rate?: string;
  total_rental_fee: string;
  security_deposit: string;
  platform_fee: string;
  total_amount: string;
  payment_method?: string;
  renter_cash_confirmed?: boolean;
  renter_cash_confirmed_at?: string | null;
  owner_cash_confirmed?: boolean;
  owner_cash_confirmed_at?: string | null;
  status:
    | 'PENDING_APPROVAL'
    | 'APPROVED_PENDING_PAYMENT'
    | 'REJECTED'
    | 'PAID_CONFIRMED'
    | 'ACTIVE'
    | 'RETURNED_PENDING_INSPECTION'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'DISPUTED';
  approval_deadline: string | null;
  payment_deadline: string | null;
  pickup_spot: string;
  created_at: string;
  has_reviewed?: boolean;
}

export interface BookingStatusHistoryItem {
  id: string;
  previous_status: string | null;
  new_status: string;
  changed_by_name: string;
  reason: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface BookingDetail extends BookingSummary {
  rejection_reason: string;
  cancellation_reason: string;
  handover_pass_code: string;
  return_notes: string;
  approved_at: string | null;
  paid_at: string | null;
  handover_at: string | null;
  returned_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  status_history: BookingStatusHistoryItem[];
  allowed_actions: string[];
}

export interface CreateBookingPayload {
  item_id: string;
  start_date?: string; // YYYY-MM-DD
  end_date?: string;   // YYYY-MM-DD
  start_datetime?: string; // ISO string
  end_datetime?: string;   // ISO string
  pickup_spot?: string;
  message_to_owner?: string;
}

export interface BookingsListResponse {
  count: number;
  results: BookingSummary[];
}

export interface HandoverPassResponse {
  booking_code: string;
  stage: 'PICKUP' | 'RETURN';
  otp: string;
  token: string;
  qr_payload: string;
  pickup_spot: string;
  expires_at: string;
  item_title: string;
  counterpart_name: string;
}

export interface VerifyPickupPayload {
  method: 'OTP' | 'QR';
  otp?: string;
  token?: string;
  pickup_condition?: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';
  pickup_notes?: string;
}

export interface VerifyReturnPayload {
  method: 'OTP' | 'QR';
  otp?: string;
  token?: string;
  return_item_condition: 'SAME' | 'MINOR_WEAR' | 'DAMAGED' | 'MISSING_ACCESSORIES';
  return_notes?: string;
}

export const bookingService = {
  createBooking: async (payload: CreateBookingPayload): Promise<BookingDetail> => {
    const res = await apiClient.post<BookingDetail>('/api/v1/bookings/create/', payload);
    return res.data;
  },

  getMyRentals: async (params?: { status?: string; search?: string }): Promise<BookingsListResponse> => {
    const res = await apiClient.get<BookingsListResponse>('/api/v1/bookings/my-rentals/', { params });
    return res.data;
  },

  getMyIncomingRequests: async (params?: { status?: string; search?: string }): Promise<BookingsListResponse> => {
    const res = await apiClient.get<BookingsListResponse>('/api/v1/bookings/my-requests/', { params });
    return res.data;
  },

  getBookingDetail: async (bookingId: string): Promise<BookingDetail> => {
    const res = await apiClient.get<BookingDetail>(`/api/v1/bookings/${bookingId}/`);
    return res.data;
  },

  acceptBooking: async (bookingId: string): Promise<BookingDetail> => {
    const res = await apiClient.post<BookingDetail>(`/api/v1/bookings/${bookingId}/accept/`);
    return res.data;
  },

  rejectBooking: async (bookingId: string, reason?: string): Promise<BookingDetail> => {
    const res = await apiClient.post<BookingDetail>(`/api/v1/bookings/${bookingId}/reject/`, { reason });
    return res.data;
  },

  cancelBooking: async (bookingId: string, reason?: string): Promise<BookingDetail> => {
    const res = await apiClient.post<BookingDetail>(`/api/v1/bookings/${bookingId}/cancel/`, { reason });
    return res.data;
  },

  initiatePayment: async (bookingId: string): Promise<BookingDetail> => {
    const res = await apiClient.post<BookingDetail>(`/api/v1/bookings/${bookingId}/confirm-cash/`);
    return res.data;
  },

  confirmCashPayment: async (bookingId: string): Promise<BookingDetail> => {
    const res = await apiClient.post<BookingDetail>(`/api/v1/bookings/${bookingId}/confirm-cash/`);
    return res.data;
  },

  confirmHandover: async (bookingId: string, passCode: string): Promise<BookingDetail> => {
    const res = await apiClient.post<BookingDetail>(`/api/v1/bookings/${bookingId}/handover/confirm/`, {
      pass_code: passCode,
    });
    return res.data;
  },

  initiateReturn: async (bookingId: string, notes?: string): Promise<BookingDetail> => {
    const res = await apiClient.post<BookingDetail>(`/api/v1/bookings/${bookingId}/return/`, { reason: notes });
    return res.data;
  },

  completeInspection: async (
    bookingId: string,
    payload: { passed: boolean; notes?: string }
  ): Promise<BookingDetail> => {
    const res = await apiClient.post<BookingDetail>(`/api/v1/bookings/${bookingId}/inspection/complete/`, payload);
    return res.data;
  },

  getBookingHistory: async (bookingId: string) => {
    const res = await apiClient.get(`/api/v1/bookings/${bookingId}/history/`);
    return res.data;
  },

  // Phase 08: Handover & Return Pass APIs
  getHandoverPass: async (bookingId: string): Promise<HandoverPassResponse> => {
    const res = await apiClient.get<HandoverPassResponse>(`/api/v1/bookings/${bookingId}/handover-pass/`);
    return res.data;
  },

  regenerateHandoverPass: async (bookingId: string): Promise<HandoverPassResponse> => {
    const res = await apiClient.post<HandoverPassResponse>(`/api/v1/bookings/${bookingId}/handover-pass/regenerate/`);
    return res.data;
  },

  verifyPickup: async (bookingId: string, payload: VerifyPickupPayload): Promise<BookingDetail> => {
    const res = await apiClient.post<BookingDetail>(`/api/v1/bookings/${bookingId}/verify-pickup/`, payload);
    return res.data;
  },

  verifyReturn: async (bookingId: string, payload: VerifyReturnPayload): Promise<BookingDetail> => {
    const res = await apiClient.post<BookingDetail>(`/api/v1/bookings/${bookingId}/verify-return/`, payload);
    return res.data;
  },

  uploadEvidence: async (
    bookingId: string,
    payload: { stage: 'PICKUP' | 'RETURN'; image_url: string; caption?: string }
  ) => {
    const res = await apiClient.post(`/api/v1/bookings/${bookingId}/evidence/`, payload);
    return res.data;
  },

  deleteBookingRecord: async (bookingId: string): Promise<{ detail: string; booking_reference: string }> => {
    const res = await apiClient.delete<{ detail: string; booking_reference: string }>(`/api/v1/bookings/${bookingId}/delete/`);
    return res.data;
  },

  clearCancelledBookings: async (): Promise<{ detail: string; deleted_count: number }> => {
    const res = await apiClient.delete<{ detail: string; deleted_count: number }>('/api/v1/bookings/clear-cancelled/');
    return res.data;
  },
};
