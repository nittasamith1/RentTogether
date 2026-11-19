import { apiClient } from './api';

export interface RecommendedItem {
  id: string;
  title: string;
  category_name: string;
  category_slug?: string;
  rental_price_per_day: number;
  security_deposit: number;
  condition: string;
  primary_image_url: string;
  owner_name: string;
  recommendation_reason?: string;
  paired_reason?: string;
  similarity_score?: number;
  match_reason?: string;
  is_available: boolean;
}

export interface PersonalizedRecommendationsResponse {
  strategy: 'PERSONALIZED_HISTORY' | 'COLD_START_DEPARTMENT' | 'COLD_START_CAMPUS_POPULAR';
  department: string | null;
  recommendations: RecommendedItem[];
}

export interface ComplementaryRecommendationsResponse {
  target_item_id: string;
  target_item_title: string;
  complementary_items: RecommendedItem[];
  similar_items: RecommendedItem[];
  suggested_accessories: string[];
}

export const recommendationService = {
  async getPersonalized(limit: number = 8): Promise<PersonalizedRecommendationsResponse> {
    const res = await apiClient.get<PersonalizedRecommendationsResponse>(
      `/api/v1/ai/recommendations/personalized/?limit=${limit}`
    );
    return res.data;
  },

  async getComplementary(itemId: string, limit: number = 6): Promise<ComplementaryRecommendationsResponse> {
    const res = await apiClient.get<ComplementaryRecommendationsResponse>(
      `/api/v1/ai/recommendations/complementary/${itemId}/?limit=${limit}`
    );
    return res.data;
  },
};
