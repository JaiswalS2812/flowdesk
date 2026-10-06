import { request } from '@/lib/api-client';
import { toQuery } from '@/lib/query';
import { AdminUpdateUserRequest, PageQuery, PageResponse, UserResponse } from '@/types';

export interface UserQuery extends PageQuery {
  search?: string;
  active?: boolean;
}

export const userService = {
  // Sorted by name
  getPage(query: UserQuery = {}): Promise<PageResponse<UserResponse>> {
    return request<PageResponse<UserResponse>>(`/api/users${toQuery(query)}`);
  },

  getSupportEngineers(): Promise<UserResponse[]> {
    return request<UserResponse[]>('/api/users/support-engineers');
  },

  getById(id: number): Promise<UserResponse> {
    return request<UserResponse>(`/api/users/${id}`);
  },

  deactivate(id: number): Promise<UserResponse> {
    return request<UserResponse>(`/api/users/${id}/deactivate`, { method: 'PATCH' });
  },

  // Admin only: change role and/or department
  update(id: number, data: AdminUpdateUserRequest): Promise<UserResponse> {
    return request<UserResponse>(`/api/users/${id}`, { method: 'PATCH', body: data });
  },

  reactivate(id: number): Promise<UserResponse> {
    return request<UserResponse>(`/api/users/${id}/reactivate`, { method: 'PATCH' });
  },
};
