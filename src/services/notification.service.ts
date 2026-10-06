import { request } from '@/lib/api-client';
import { toQuery } from '@/lib/query';
import { NotificationResponse, PageQuery, PageResponse } from '@/types';

export const notificationService = {
  // Newest first
  getPage(query: PageQuery = {}): Promise<PageResponse<NotificationResponse>> {
    return request<PageResponse<NotificationResponse>>(`/api/notifications${toQuery(query)}`);
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
