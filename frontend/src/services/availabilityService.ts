import { apiClient } from './api';

export interface AvailabilityBlock {
  id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD (exclusive)
  start_datetime?: string | null;
  end_datetime?: string | null;
  reason: 'BOOKED' | 'OWNER_UNAVAILABLE' | 'MAINTENANCE';
  is_owner_block?: boolean;
}

export interface ItemAvailabilityResponse {
  item_id: string;
  timezone: string;
  availability: AvailabilityBlock[];
}

export interface CheckAvailabilityResponse {
  item_id: string;
  available: boolean;
  conflict?: {
    reason: string;
    start_date: string;
    end_date: string;
    start_datetime?: string | null;
    end_datetime?: string | null;
  } | null;
}

export interface CreateManualBlockPayload {
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD (exclusive)
  reason: 'OWNER_UNAVAILABLE' | 'MAINTENANCE';
}

export interface OwnerCalendarBlock {
  id: string;
  item_id: string;
  item_title: string;
  item_thumbnail: string | null;
  start_date: string;
  end_date: string;
  reason: 'BOOKED' | 'OWNER_UNAVAILABLE' | 'MAINTENANCE';
  booking_id: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface OwnerCalendarResponse {
  count: number;
  results: OwnerCalendarBlock[];
}

export const availabilityService = {
  // Get unavailable intervals for a specific item
  getItemAvailability: async (itemId: string, startDate?: string, endDate?: string): Promise<ItemAvailabilityResponse> => {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const res = await apiClient.get<ItemAvailabilityResponse>(`/api/v1/availability/items/${itemId}/`, { params });
    return res.data;
  },

  // Check if a specific date range is available
  checkItemAvailability: async (itemId: string, startDate: string, endDate: string): Promise<CheckAvailabilityResponse> => {
    const res = await apiClient.get<CheckAvailabilityResponse>(`/api/v1/availability/items/${itemId}/check/`, {
      params: { start_date: startDate, end_date: endDate }
    });
    return res.data;
  },

  // Create manual owner or maintenance block
  createManualBlock: async (itemId: string, payload: CreateManualBlockPayload): Promise<AvailabilityBlock> => {
    const res = await apiClient.post<AvailabilityBlock>(`/api/v1/availability/items/${itemId}/blocks/`, payload);
    return res.data;
  },

  // Delete manual block
  deleteManualBlock: async (blockId: string): Promise<void> => {
    await apiClient.delete(`/api/v1/availability/blocks/${blockId}/`);
  },

  // Get full owner availability calendar across all owned items
  getOwnerCalendar: async (params?: {
    start_date?: string;
    end_date?: string;
    item_id?: string;
    reason?: string;
  }): Promise<OwnerCalendarResponse> => {
    const res = await apiClient.get<OwnerCalendarResponse>('/api/v1/availability/my-calendar/', { params });
    return res.data;
  },
};
