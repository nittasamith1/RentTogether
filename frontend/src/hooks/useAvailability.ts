import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  availabilityService,
  CreateManualBlockPayload,
  ItemAvailabilityResponse,
  CheckAvailabilityResponse,
  OwnerCalendarResponse
} from '../services/availabilityService';

export const AVAILABILITY_KEYS = {
  all: ['availability'] as const,
  item: (itemId: string, startDate?: string, endDate?: string) =>
    [...AVAILABILITY_KEYS.all, 'item', itemId, startDate, endDate] as const,
  check: (itemId: string, startDate?: string, endDate?: string) =>
    [...AVAILABILITY_KEYS.all, 'check', itemId, startDate, endDate] as const,
  ownerCalendar: (params?: Record<string, string | undefined>) =>
    [...AVAILABILITY_KEYS.all, 'ownerCalendar', params] as const,
};

export const useItemAvailability = (itemId: string, startDate?: string, endDate?: string) => {
  return useQuery<ItemAvailabilityResponse, Error>({
    queryKey: AVAILABILITY_KEYS.item(itemId, startDate, endDate),
    queryFn: () => availabilityService.getItemAvailability(itemId, startDate, endDate),
    enabled: Boolean(itemId),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useCheckAvailability = (itemId: string, startDate: string, endDate: string) => {
  return useQuery<CheckAvailabilityResponse, Error>({
    queryKey: AVAILABILITY_KEYS.check(itemId, startDate, endDate),
    queryFn: () => availabilityService.checkItemAvailability(itemId, startDate, endDate),
    enabled: Boolean(itemId && startDate && endDate),
    staleTime: 1000 * 30, // 30 seconds
  });
};

export const useOwnerCalendar = (params?: {
  start_date?: string;
  end_date?: string;
  item_id?: string;
  reason?: string;
}) => {
  return useQuery<OwnerCalendarResponse, Error>({
    queryKey: AVAILABILITY_KEYS.ownerCalendar(params),
    queryFn: () => availabilityService.getOwnerCalendar(params),
    staleTime: 1000 * 60 * 2,
  });
};

export const useCreateManualBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: CreateManualBlockPayload }) =>
      availabilityService.createManualBlock(itemId, payload),
    onSuccess: (_, { itemId }) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [...AVAILABILITY_KEYS.all, 'item', itemId] });
      queryClient.invalidateQueries({ queryKey: [...AVAILABILITY_KEYS.all, 'ownerCalendar'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-items'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-popular'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-categories'] });
      queryClient.invalidateQueries({ queryKey: ['popular-items-dashboard'] });
    },
  });
};

export const useDeleteManualBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ blockId }: { blockId: string; itemId?: string }) =>
      availabilityService.deleteManualBlock(blockId),
    onSuccess: (_, { itemId }) => {
      if (itemId) {
        queryClient.invalidateQueries({ queryKey: [...AVAILABILITY_KEYS.all, 'item', itemId] });
      } else {
        queryClient.invalidateQueries({ queryKey: AVAILABILITY_KEYS.all });
      }
      queryClient.invalidateQueries({ queryKey: [...AVAILABILITY_KEYS.all, 'ownerCalendar'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-items'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-popular'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-categories'] });
      queryClient.invalidateQueries({ queryKey: ['popular-items-dashboard'] });
    },
  });
};

