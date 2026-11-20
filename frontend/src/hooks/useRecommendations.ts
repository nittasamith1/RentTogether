import { useQuery } from '@tanstack/react-query';
import {
  recommendationService,
  PersonalizedRecommendationsResponse,
  ComplementaryRecommendationsResponse,
} from '../services/recommendationService';

export function usePersonalizedRecommendations(limit: number = 8) {
  return useQuery<PersonalizedRecommendationsResponse>({
    queryKey: ['personalized-recommendations', limit],
    queryFn: () => recommendationService.getPersonalized(limit),
    staleTime: 60000,
  });
}

export function useComplementaryRecommendations(itemId: string | null, limit: number = 6) {
  return useQuery<ComplementaryRecommendationsResponse>({
    queryKey: ['complementary-recommendations', itemId, limit],
    queryFn: () => recommendationService.getComplementary(itemId!, limit),
    enabled: Boolean(itemId),
    staleTime: 60000,
  });
}
