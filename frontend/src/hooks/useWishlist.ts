import { useMutation, useQueryClient } from '@tanstack/react-query';
import { marketplaceService } from '../services/marketplace';

export function useWishlist() {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: async ({ itemId, isWishlisted }: { itemId: string; isWishlisted: boolean }) => {
      if (isWishlisted) {
        return await marketplaceService.removeFromWishlist(itemId);
      } else {
        return await marketplaceService.addToWishlist(itemId);
      }
    },
    onSuccess: () => {
      // Refresh items, popular resources, and wishlist
      queryClient.invalidateQueries({ queryKey: ['marketplace-items'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-popular'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['item-detail'] });
    },
  });

  return {
    toggleWishlist: (itemId: string, isCurrentlyWishlisted: boolean) =>
      toggleMutation.mutateAsync({ itemId, isWishlisted: isCurrentlyWishlisted }),
    isLoading: toggleMutation.isPending,
  };
}

