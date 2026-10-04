import { request } from '@/lib/api-client';
import { UserResponse } from '@/types';

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

  delete(id: number): Promise<void> {
    return request<void>(`/api/users/${id}`, { method: 'DELETE' });
  },
};
