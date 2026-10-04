import { request } from '@/lib/api-client';
import { SlaPolicyResponse, UpdateSlaPolicyRequest } from '@/types';

export const slaPolicyService = {
  getAll(): Promise<SlaPolicyResponse[]> {
    return request<SlaPolicyResponse[]>('/api/admin/sla-policies');
  },

  update(id: number, data: UpdateSlaPolicyRequest): Promise<SlaPolicyResponse> {
    return request<SlaPolicyResponse>(`/api/admin/sla-policies/${id}`, {
      method: 'PUT',
      body: data,
    });
  },

  toggle(id: number): Promise<SlaPolicyResponse> {
    return request<SlaPolicyResponse>(`/api/admin/sla-policies/${id}/toggle`, {
      method: 'PATCH',
    });
  },
};

