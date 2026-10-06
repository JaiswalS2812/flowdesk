import { request } from '@/lib/api-client';
import { toQuery } from '@/lib/query';
import { ActivitySummary, AuditLogResponse, PageQuery, PageResponse } from '@/types';

export interface ActivityQuery extends PageQuery {
  action?: string;
  search?: string;
}

export const activityService = {
  // Newest first
  getPage(query: ActivityQuery = {}): Promise<PageResponse<AuditLogResponse>> {
    return request<PageResponse<AuditLogResponse>>(`/api/admin/activity${toQuery(query)}`);
  },

  getSummary(): Promise<ActivitySummary> {
    return request<ActivitySummary>('/api/admin/activity/summary');
  },
};

