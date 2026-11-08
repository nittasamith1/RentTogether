import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listingService,
  MyListingsFilters,
  MyListingsResponse,
  OwnerListingDetail,
  PriceRecommendationRequest,
  PriceRecommendationResponse,
  ItemRentalHistoryResponse,
} from '../services/listingService';
import { marketplaceService, Category } from '../services/marketplace';

export const LISTINGS_QUERY_KEY = 'my-listings';
export const LISTING_DETAIL_QUERY_KEY = 'listing-detail';
export const CATEGORIES_QUERY_KEY = 'marketplace-categories';

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: [CATEGORIES_QUERY_KEY],
    queryFn: () => marketplaceService.getCategories(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useMyListings(filters: MyListingsFilters = {}) {
  return useQuery<MyListingsResponse>({
    queryKey: [LISTINGS_QUERY_KEY, filters],
    queryFn: () => listingService.getMyListings(filters),
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useListingDetail(itemId: string | null) {
  return useQuery<OwnerListingDetail>({
    queryKey: [LISTING_DETAIL_QUERY_KEY, itemId],
    queryFn: () => listingService.getListingDetail(itemId!),
    enabled: Boolean(itemId),
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => listingService.createListing(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LISTINGS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['marketplace_items'] });
    },
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: Partial<OwnerListingDetail> }) =>
      listingService.updateListing(itemId, data),
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: [LISTINGS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [LISTING_DETAIL_QUERY_KEY, updatedItem.id] });
      queryClient.invalidateQueries({ queryKey: ['marketplace_items'] });
    },
  });
}

export function useUpdateListingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, status }: { itemId: string; status: 'ACTIVE' | 'PAUSED' }) =>
      listingService.updateStatus(itemId, status),
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: [LISTINGS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [LISTING_DETAIL_QUERY_KEY, updatedItem.id] });
      queryClient.invalidateQueries({ queryKey: ['marketplace_items'] });
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => listingService.deleteListing(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LISTINGS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['marketplace_items'] });
    },
  });
}

export function usePriceRecommendation() {
  return useMutation<PriceRecommendationResponse, Error, PriceRecommendationRequest>({
    mutationFn: (payload: PriceRecommendationRequest) =>
      listingService.getPriceRecommendation(payload),
  });
}

export function useUploadListingImages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, files }: { itemId: string; files: File[] }) =>
      listingService.uploadImages(itemId, files),
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: [LISTINGS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [LISTING_DETAIL_QUERY_KEY, updatedItem.id] });
    },
  });
}

export function useDeleteListingImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, imageId }: { itemId: string; imageId: string }) =>
      listingService.deleteImage(itemId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LISTINGS_QUERY_KEY] });
    },
  });
}

export function useListingRentalHistory(itemId: string | null) {
  return useQuery<ItemRentalHistoryResponse>({
    queryKey: ['listing-rental-history', itemId],
    queryFn: () => listingService.getRentalHistory(itemId!),
    enabled: Boolean(itemId),
    staleTime: 1000 * 30,
  });
}
