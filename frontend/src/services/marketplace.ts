import { apiClient } from './api';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_name: string;
  image_url: string | null;
  display_order: number;
  eligible_item_count: number;
}

export interface OwnerSummary {
  id: string;
  display_name: string;
  avatar: string;
  reputation: number;
  badge: string;
  review_count: number;
  department: string;
  year_of_study: number;
}

export interface ItemGalleryImage {
  id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

export interface ItemSummary {
  id: string;
  title: string;
  short_description: string;
  primary_image_url: string;
  category_name: string;
  category_slug: string;
  category_icon: string;
  condition: 'BRAND_NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';
  brand: string;
  model_name: string;
  daily_rental_price: string | number;
  security_deposit: string | number;
  availability_status: 'AVAILABLE' | 'RENTED';
  completed_rental_count: number;
  is_wishlisted: boolean;
  pickup_locations: string[];
  owner: OwnerSummary;
  created_at: string;
}

export interface ItemDetail extends ItemSummary {
  description: string;
  original_purchase_price: string | number | null;
  min_rental_days: number;
  max_rental_days: number;
  images: ItemGalleryImage[];
  related_items: ItemSummary[];
  is_own_item: boolean;
}

export interface MarketplaceFilterParams {
  search?: string;
  category?: string;
  min_price?: number | string;
  max_price?: number | string;
  condition?: string;
  start_date?: string;
  end_date?: string;
  availability?: string;
  pickup_spot?: string;
  min_rating?: number | string;
  sort?: string;
  page?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface WishlistActionResponse {
  item_id: string;
  is_wishlisted: boolean;
  message: string;
}

export const marketplaceService = {
  // 1. Fetch available categories
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/api/v1/marketplace/categories/');
    return response.data;
  },

  // 2. Fetch paginated, filtered, searchable marketplace items
  async getItems(params?: MarketplaceFilterParams): Promise<PaginatedResponse<ItemSummary>> {
    const cleanParams: Record<string, string | number> = {};
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          cleanParams[key] = val;
        }
      });
    }
    const response = await apiClient.get<PaginatedResponse<ItemSummary>>('/api/v1/marketplace/items/', {
      params: cleanParams,
    });
    return response.data;
  },

  // 3. Fetch single item details
  async getItemDetail(itemId: string): Promise<ItemDetail> {
    const response = await apiClient.get<ItemDetail>(`/api/v1/marketplace/items/${itemId}/`);
    return response.data;
  },

  // 4. Add item to student's personal wishlist
  async addToWishlist(itemId: string): Promise<WishlistActionResponse> {
    const response = await apiClient.post<WishlistActionResponse>(`/api/v1/marketplace/items/${itemId}/wishlist/`);
    return response.data;
  },

  // 5. Remove item from wishlist
  async removeFromWishlist(itemId: string): Promise<WishlistActionResponse> {
    const response = await apiClient.delete<WishlistActionResponse>(`/api/v1/marketplace/items/${itemId}/wishlist/`);
    return response.data;
  },

  // 6. Clear entire personal wishlist history to free storage
  async clearWishlist(): Promise<{ detail: string; deleted_count: number }> {
    const response = await apiClient.delete<{ detail: string; deleted_count: number }>('/api/v1/marketplace/wishlist/clear/');
    return response.data;
  },

  // 6. Fetch saved wishlist items with optional search
  async getWishlist(page: number = 1, search?: string): Promise<PaginatedResponse<ItemSummary>> {
    const response = await apiClient.get<PaginatedResponse<ItemSummary>>('/api/v1/marketplace/wishlist/', {
      params: {
        page,
        search: search?.trim() || undefined,
      },
    });
    return response.data;
  },

  // 7. Fetch campus popular/trending items
  async getPopularItems(): Promise<ItemSummary[]> {
    const response = await apiClient.get<ItemSummary[]>('/api/v1/marketplace/popular/');
    return response.data;
  },
};

