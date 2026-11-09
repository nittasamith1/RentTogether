import { apiClient } from './api';

export interface ListingImage {
  id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export interface OwnerListingSummary {
  id: string;
  title: string;
  primary_image_url: string;
  category_name: string;
  category_slug: string;
  condition: 'BRAND_NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';
  rental_price_per_day: number;
  security_deposit: number;
  status: 'ACTIVE' | 'PAUSED' | 'REMOVED';
  rental_count: number;
  active_bookings_count: number;
  completed_bookings_count: number;
  pickup_location: string;
  published_at: string | null;
  created_at: string;
}

export interface OwnerListingDetail extends OwnerListingSummary {
  description: string;
  brand: string;
  model_name: string;
  original_price: number;
  item_age_months: number;
  purchase_date: string | null;
  min_rental_days: number;
  max_rental_days: number;
  pickup_instructions: string;
  is_published: boolean;
  images: ListingImage[];
  updated_at: string;
}

export interface OwnerListingStats {
  total_listings: number;
  active_listings: number;
  paused_listings: number;
  total_completed_rentals: number;
}

export interface MyListingsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: OwnerListingSummary[];
  stats: OwnerListingStats;
}

export interface MyListingsFilters {
  status?: string;
  category?: string;
  search?: string;
  page?: number;
}

export interface PriceRecommendationRequest {
  category_id: string;
  condition: string;
  original_price: number;
  item_age_months: number;
}

export interface PriceRecommendationResponse {
  recommended_price: number;
  min_price: number;
  max_price: number;
  currency: string;
  confidence_score: number;
  explanation_factors: string[];
  formula_used: string;
}

export interface RentalHistoryRecord {
  id: string;
  booking_reference: string;
  renter_name: string;
  renter_avatar: string;
  status: string;
  start_date: string;
  end_date: string;
  actual_return_date: string | null;
  rental_price_inr: number;
  deposit_amount_inr: number;
  pickup_spot: string;
  created_at: string;
  has_reviewed?: boolean;
}

export interface ItemRentalHistoryResponse {
  item_id: string;
  item_title: string;
  total_rentals: number;
  rental_history: RentalHistoryRecord[];
}

export const listingService = {
  // Fetch owner's inventory listings with filters and KPI stats
  async getMyListings(filters: MyListingsFilters = {}): Promise<MyListingsResponse> {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());

    const response = await apiClient.get<MyListingsResponse>(
      `/api/v1/listings/my-listings/?${params.toString()}`
    );
    return response.data;
  },

  // Retrieve detail of a single owned listing
  async getListingDetail(itemId: string): Promise<OwnerListingDetail> {
    const response = await apiClient.get<OwnerListingDetail>(`/api/v1/listings/${itemId}/`);
    return response.data;
  },

  // Create a new listing with multipart form data (including images)
  async createListing(formData: FormData): Promise<OwnerListingDetail> {
    const response = await apiClient.post<OwnerListingDetail>(
      '/api/v1/listings/create/',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Partially update listing parameters
  async updateListing(itemId: string, data: Partial<OwnerListingDetail>): Promise<OwnerListingDetail> {
    const response = await apiClient.patch<OwnerListingDetail>(
      `/api/v1/listings/${itemId}/`,
      data
    );
    return response.data;
  },

  // Toggle pause or resume status
  async updateStatus(itemId: string, status: 'ACTIVE' | 'PAUSED'): Promise<OwnerListingDetail> {
    const response = await apiClient.patch<OwnerListingDetail>(
      `/api/v1/listings/${itemId}/status/`,
      { status }
    );
    return response.data;
  },

  // Soft delete a listing
  async deleteListing(itemId: string): Promise<{ detail: string }> {
    const response = await apiClient.delete<{ detail: string }>(`/api/v1/listings/${itemId}/`);
    return response.data;
  },

  // Request AI price recommendation
  async getPriceRecommendation(
    payload: PriceRecommendationRequest
  ): Promise<PriceRecommendationResponse> {
    const response = await apiClient.post<PriceRecommendationResponse>(
      '/api/v1/listings/price-recommendation/',
      payload
    );
    return response.data;
  },

  // Upload supplementary images to an existing listing
  async uploadImages(itemId: string, files: File[]): Promise<OwnerListingDetail> {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    const response = await apiClient.post<OwnerListingDetail>(
      `/api/v1/listings/${itemId}/images/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Delete an image from a listing
  async deleteImage(itemId: string, imageId: string): Promise<{ detail: string }> {
    const response = await apiClient.delete<{ detail: string }>(
      `/api/v1/listings/${itemId}/images/${imageId}/`
    );
    return response.data;
  },

  // Fetch rental booking history for an item
  async getRentalHistory(itemId: string): Promise<ItemRentalHistoryResponse> {
    const response = await apiClient.get<ItemRentalHistoryResponse>(
      `/api/v1/listings/${itemId}/rental-history/`
    );
    return response.data;
  },
};

