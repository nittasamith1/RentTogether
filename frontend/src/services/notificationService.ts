import { apiClient } from './api';

export interface NotificationItem {
  id: string;
  recipient_id: string;
  actor_name: string;
  notification_type: string;
  title: string;
  body: string;
  action_url: string;
  target_object_id: string | null;
  target_content_type: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: NotificationItem[];
}

export const notificationService = {
  /**
   * Fetch paginated list of notifications
   */
  async getNotifications(page = 1, pageSize = 20): Promise<NotificationListResponse> {
    const res = await apiClient.get<NotificationListResponse>('/api/v1/notifications/', {
      params: { page, page_size: pageSize },
    });
    return res.data;
  },

  /**
   * Fetch unread notification count
   */
  async getUnreadCount(): Promise<number> {
    const res = await apiClient.get<{ unread_count: number }>('/api/v1/notifications/unread-count/');
    return res.data.unread_count;
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(id: string): Promise<NotificationItem> {
    const res = await apiClient.post<NotificationItem>(`/api/v1/notifications/${id}/read/`);
    return res.data;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ message: string; updated_count: number }> {
    const res = await apiClient.post<{ message: string; updated_count: number }>('/api/v1/notifications/read-all/');
    return res.data;
  },

  /**
   * Delete a notification to free database storage
   */
  async deleteNotification(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/notifications/${id}/`);
  },

  /**
   * Clear notifications history to reclaim database storage
   * @param scope 'read' to purge only read alerts (default), or 'all' to purge all notifications
   */
  async clearNotifications(scope: 'read' | 'all' = 'read'): Promise<{ detail: string; deleted_count: number; scope: string }> {
    const res = await apiClient.delete<{ detail: string; deleted_count: number; scope: string }>(
      '/api/v1/notifications/clear/',
      { params: { scope } }
    );
    return res.data;
  },
};
