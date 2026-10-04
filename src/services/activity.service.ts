import { request } from '@/lib/api-client';
import { AuditLogResponse } from '@/types';

export const activityService = {
  getAll(): Promise<AuditLogResponse[]> {
    return request<AuditLogResponse[]>('/api/admin/activity');
  },
};

