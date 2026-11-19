import { apiClient } from './api';

export interface CategoryImpactBreakdown {
  category: string;
  completed_rentals: number;
  waste_avoided_kg: number;
  money_saved_inr: number;
}

export interface StudentImpactResponse {
  active_rentals: number;
  completed_rentals: number;
  money_saved_inr: number;
  waste_avoided_kg: number;
  co2_saved_kg: number;
  trees_equivalent: number;
  contribution_percentile: number;
  category_breakdown: CategoryImpactBreakdown[];
}

export interface CampusImpactResponse {
  college_name: string;
  total_resources_reused: number;
  total_money_saved_inr: number;
  total_waste_avoided_kg: number;
  total_co2_saved_kg: number;
  trees_equivalent: number;
  top_sustainable_categories: Array<{ category: string; waste_avoided_kg: number }>;
}

export const sustainabilityService = {
  async getMyImpact(): Promise<StudentImpactResponse> {
    const res = await apiClient.get<StudentImpactResponse>('/api/v1/sustainability/my-impact/');
    return res.data;
  },

  async getCampusImpact(): Promise<CampusImpactResponse> {
    const res = await apiClient.get<CampusImpactResponse>('/api/v1/sustainability/campus-impact/');
    return res.data;
  },
};
