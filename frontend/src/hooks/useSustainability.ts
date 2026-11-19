import { useQuery } from '@tanstack/react-query';
import {
  sustainabilityService,
  StudentImpactResponse,
  CampusImpactResponse,
} from '../services/sustainabilityService';

export function useMyImpact() {
  return useQuery<StudentImpactResponse>({
    queryKey: ['my-sustainability-impact'],
    queryFn: () => sustainabilityService.getMyImpact(),
    staleTime: 0,
    refetchInterval: 15000, // Live real-time updates
  });
}

export function useCampusImpact() {
  return useQuery<CampusImpactResponse>({
    queryKey: ['campus-sustainability-impact'],
    queryFn: () => sustainabilityService.getCampusImpact(),
    staleTime: 0,
    refetchInterval: 30000,
  });
}
