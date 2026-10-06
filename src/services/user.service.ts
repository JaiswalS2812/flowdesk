import { request } from '@/lib/api-client';
import { AdminUpdateUserRequest, UserResponse } from '@/types';

export const userService = {
  getAll(): Promise<UserResponse[]> {
    return request<UserResponse[]>('/api/users');
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
