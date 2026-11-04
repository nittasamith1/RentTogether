import { apiClient } from './api';
import {
  DetailedStudentProfile,
  PublicStudentProfile,
  StudentReviewItem,
  StudentReviewCreatePayload,
  StudentProfileUpdatePayload,
} from '../types';

export interface PaginatedReviewsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: StudentReviewItem[];
}

export const profileService = {
  /**
   * Retrieves the authenticated student's full profile, dual reputation,
   * lifetime savings/earnings, and booking activity stats.
   */
  async getProfileMe(): Promise<DetailedStudentProfile> {
    const response = await apiClient.get<DetailedStudentProfile>('/api/v1/profiles/me/');
    return response.data;
  },

  /**
   * Updates student editable profile fields: bio, phone, avatar, pickup spots.
   */
  async updateProfileMe(payload: StudentProfileUpdatePayload): Promise<DetailedStudentProfile> {
    // If an avatar file is provided, use multipart/form-data
    if (payload.avatar instanceof File) {
      const formData = new FormData();
      if (payload.bio !== undefined) formData.append('bio', payload.bio);
      if (payload.phone_number !== undefined) formData.append('phone_number', payload.phone_number);
      if (payload.avatar) formData.append('avatar', payload.avatar);
      if (payload.preferred_pickup_spots) {
        payload.preferred_pickup_spots.forEach((spot) => {
          formData.append('preferred_pickup_spots', spot);
        });
      }
      const response = await apiClient.patch<DetailedStudentProfile>('/api/v1/profiles/me/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    }

    const response = await apiClient.patch<DetailedStudentProfile>('/api/v1/profiles/me/', payload);
    return response.data;
  },

  /**
   * Retrieves peer public profile (sanitizes sensitive contact details).
   */
  async getPublicProfile(studentId: string): Promise<PublicStudentProfile> {
    const response = await apiClient.get<PublicStudentProfile>(`/api/v1/profiles/${studentId}/`);
    return response.data;
  },

  /**
   * Submits a multi-criteria review for a completed rental.
   */
  async submitReview(payload: StudentReviewCreatePayload): Promise<StudentReviewItem> {
    const response = await apiClient.post<StudentReviewItem>('/api/v1/profiles/reviews/', payload);
    return response.data;
  },

  /**
   * Lists verified reviews received by a student, with optional review_type filter.
   */
  async getStudentReviews(
    studentId: string,
    reviewType?: 'OWNER' | 'RENTER',
    page = 1
  ): Promise<PaginatedReviewsResponse> {
    const params: Record<string, string | number> = { page };
    if (reviewType) {
      params.type = reviewType;
    }
    const response = await apiClient.get<PaginatedReviewsResponse | StudentReviewItem[]>(
      `/api/v1/profiles/${studentId}/reviews/`,
      { params }
    );

    // Normalize in case pagination is direct array or paginated object
    if (Array.isArray(response.data)) {
      return {
        count: response.data.length,
        next: null,
        previous: null,
        results: response.data,
      };
    }
    return response.data;
  },
};

