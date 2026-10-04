import { request } from '@/lib/api-client';
import { NotificationResponse } from '@/types';

export const notificationService = {
  getAll(): Promise<NotificationResponse[]> {
    return request<NotificationResponse[]>('/api/notifications');
  },

  getUnreadCount(): Promise<{ unreadCount: number }> {
    return request<{ unreadCount: number }>('/api/notifications/unread-count');
  },

  markAsRead(id: number): Promise<NotificationResponse> {
    return request<NotificationResponse>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  markAllAsRead(): Promise<void> {
    return request<void>('/api/notifications/read-all', {
      method: 'PATCH',
    });
  },
};
