import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { marketplaceService, ItemSummary, ItemDetail, PaginatedResponse } from '../services/marketplace';
import { useAuth } from '../context/AuthContext';
import { toast } from '../context/DialogContext';

export function useWishlist() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const pendingItemsRef = useRef<Set<string>>(new Set());

  // Query to fetch user's wishlist with optional backend search
  const useWishlistItems = (page: number = 1, search?: string) => {
    return useQuery<PaginatedResponse<ItemSummary>>({
      queryKey: ['marketplace-wishlist', page, search?.trim() || ''],
      queryFn: () => marketplaceService.getWishlist(page, search),
      enabled: Boolean(user),
      staleTime: 1000 * 60 * 2,
    });
  };

  const toggleMutation = useMutation({
    mutationFn: async ({ itemId, nextState }: { itemId: string; nextState: boolean }) => {
      if (!nextState) {
        return await marketplaceService.removeFromWishlist(itemId);
      } else {
        return await marketplaceService.addToWishlist(itemId);
      }
    },
    onMutate: async ({ itemId, nextState }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['marketplace-items'] });
      await queryClient.cancelQueries({ queryKey: ['marketplace-popular'] });
      await queryClient.cancelQueries({ queryKey: ['popular-items-dashboard'] });
      await queryClient.cancelQueries({ queryKey: ['marketplace-wishlist'] });
      await queryClient.cancelQueries({ queryKey: ['item-detail', itemId] });

      // Snapshots for rollback
      const prevPopular = queryClient.getQueryData<ItemSummary[]>(['marketplace-popular']);
      const prevDashboardPopular = queryClient.getQueryData<ItemSummary[]>(['popular-items-dashboard']);
      const prevDetail = queryClient.getQueryData<ItemDetail>(['item-detail', itemId]);

      // 1. Update ['marketplace-items'] queries
      queryClient.setQueriesData({ queryKey: ['marketplace-items'] }, (oldData: any) => {
        if (!oldData || !oldData.results) return oldData;
        return {
          ...oldData,
          results: oldData.results.map((it: ItemSummary) =>
            it.id === itemId ? { ...it, is_wishlisted: nextState } : it
          ),
        };
      });

      // 2. Update popular queries
      const updateList = (list: ItemSummary[] | undefined) => {
        if (!list) return list;
        return list.map((it) => (it.id === itemId ? { ...it, is_wishlisted: nextState } : it));
      };
      queryClient.setQueryData<ItemSummary[]>(['marketplace-popular'], updateList);
      queryClient.setQueryData<ItemSummary[]>(['popular-items-dashboard'], updateList);

      // 3. Update ['item-detail', itemId]
      queryClient.setQueryData<ItemDetail>(['item-detail', itemId], (oldDetail) => {
        if (!oldDetail) return oldDetail;
        return { ...oldDetail, is_wishlisted: nextState };
      });

      // 4. Update ['marketplace-wishlist'] queries
      queryClient.setQueriesData({ queryKey: ['marketplace-wishlist'] }, (oldData: any) => {
        if (!oldData || !oldData.results) return oldData;
        if (!nextState) {
          // Remove from list
          return {
            ...oldData,
            count: Math.max(0, oldData.count - 1),
            results: oldData.results.filter((it: ItemSummary) => it.id !== itemId),
          };
        }
        return oldData;
      });

      return { prevPopular, prevDashboardPopular, prevDetail };
    },
    onError: (_err: any, { itemId, nextState }, context) => {
      const rollback = !nextState;
      queryClient.setQueriesData({ queryKey: ['marketplace-items'] }, (oldData: any) => {
        if (!oldData || !oldData.results) return oldData;
        return {
          ...oldData,
          results: oldData.results.map((it: ItemSummary) =>
            it.id === itemId ? { ...it, is_wishlisted: rollback } : it
          ),
        };
      });
      if (context?.prevPopular) {
        queryClient.setQueryData(['marketplace-popular'], context.prevPopular);
      }
      if (context?.prevDashboardPopular) {
        queryClient.setQueryData(['popular-items-dashboard'], context.prevDashboardPopular);
      }
      if (context?.prevDetail) {
        queryClient.setQueryData(['item-detail', itemId], context.prevDetail);
      }
      queryClient.invalidateQueries({ queryKey: ['marketplace-wishlist'] });
    },
    onSettled: (_data, _err, { itemId }) => {
      pendingItemsRef.current.delete(itemId);
      queryClient.invalidateQueries({ queryKey: ['marketplace-wishlist'] });
    },
  });

  const toggleWishlist = (
    item: { id: string; owner?: { id: string } | null; owner_id?: string; is_wishlisted: boolean },
    forcedStatus?: boolean
  ) => {
    if (!user) {
      toast.warning('Please log in to save items to your campus wishlist.');
      return;
    }

    // Prevent liking own items
    const ownerId = item.owner?.id || item.owner_id;
    if (ownerId && ownerId === user.id) {
      toast.info('You cannot add your own listed resource to your wishlist.');
      return;
    }

    // Prevent rapid repeated clicks creating duplicate in-flight requests
    if (pendingItemsRef.current.has(item.id)) {
      return;
    }
    pendingItemsRef.current.add(item.id);

    const currentStatus = forcedStatus !== undefined ? forcedStatus : item.is_wishlisted;
    const nextState = !currentStatus;
    toggleMutation.mutate({ itemId: item.id, nextState });
  };

  const clearWishlistMutation = useMutation({
    mutationFn: async () => {
      return await marketplaceService.clearWishlist();
    },
    onSuccess: () => {
      queryClient.setQueriesData({ queryKey: ['marketplace-wishlist'] }, { count: 0, results: [], next: null, previous: null });
      queryClient.invalidateQueries({ queryKey: ['marketplace-items'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-popular'] });
      queryClient.invalidateQueries({ queryKey: ['popular-items-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-wishlist'] });
    },
  });

  return {
    toggleWishlist,
    useWishlistItems,
    isLoading: toggleMutation.isPending,
    clearWishlist: clearWishlistMutation.mutate,
    clearWishlistAsync: clearWishlistMutation.mutateAsync,
    isClearing: clearWishlistMutation.isPending,
  };
}
