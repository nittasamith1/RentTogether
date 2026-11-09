import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService, NotificationItem } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  // Query unread count with 30s background polling
  const unreadCountQuery = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
    enabled: !!isAuthenticated,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Query notification list
  const notificationsQuery = useQuery({
    queryKey: ['notifications-list'],
    queryFn: () => notificationService.getNotifications(1, 20),
    enabled: !!isAuthenticated,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Mutation to mark single notification as read
  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: (updatedItem) => {
      // Optimistically update list
      queryClient.setQueryData(['notifications-list'], (old: any) => {
        if (!old || !old.results) return old;
        return {
          ...old,
          results: old.results.map((n: NotificationItem) =>
            n.id === updatedItem.id ? { ...n, is_read: true, read_at: updatedItem.read_at } : n
          ),
        };
      });
      // Invalidate count
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  // Mutation to mark all notifications as read
  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.setQueryData(['notifications-list'], (old: any) => {
        if (!old || !old.results) return old;
        return {
          ...old,
          results: old.results.map((n: NotificationItem) => ({ ...n, is_read: true })),
        };
      });
      queryClient.setQueryData(['notifications-unread-count'], 0);
    },
  });

  // Mutation to delete a notification
  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationService.deleteNotification(id),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(['notifications-list'], (old: any) => {
        if (!old || !old.results) return old;
        return {
          ...old,
          count: Math.max(0, old.count - 1),
          results: old.results.filter((n: NotificationItem) => n.id !== deletedId),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  // Mutation to clear notifications history (read or all) to save storage
  const clearMutation = useMutation({
    mutationFn: (scope?: 'read' | 'all') => notificationService.clearNotifications(scope || 'read'),
    onSuccess: (_, scope) => {
      if (scope === 'all') {
        queryClient.setQueryData(['notifications-list'], { count: 0, results: [], next: null, previous: null });
        queryClient.setQueryData(['notifications-unread-count'], 0);
      } else {
        queryClient.setQueryData(['notifications-list'], (old: any) => {
          if (!old || !old.results) return old;
          const unreadOnly = old.results.filter((n: NotificationItem) => !n.is_read);
          return {
            ...old,
            count: unreadOnly.length,
            results: unreadOnly,
          };
        });
      }
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    },
  });

  return {
    notifications: notificationsQuery.data?.results || [],
    totalCount: notificationsQuery.data?.count || 0,
    unreadCount: unreadCountQuery.data ?? 0,
    isLoading: notificationsQuery.isLoading,
    isRefetching: notificationsQuery.isRefetching,
    refetch: () => {
      notificationsQuery.refetch();
      unreadCountQuery.refetch();
    },
    markAsRead: markReadMutation.mutate,
    markAllAsRead: markAllReadMutation.mutate,
    isMarkingAllRead: markAllReadMutation.isPending,
    deleteNotification: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    clearNotifications: clearMutation.mutate,
    clearNotificationsAsync: clearMutation.mutateAsync,
    isClearing: clearMutation.isPending,
  };
};

