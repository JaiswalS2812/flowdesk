import { request } from '@/lib/api-client';
import {
  TicketResponse,
  CreateTicketRequest,
  AssignTicketRequest,
  UpdateTicketStatusRequest,
  SlaStatusResponse,
  CommentResponse,
  CreateCommentRequest,
} from '@/types';

export const ticketService = {
  // ─── Tickets ──────────────────────────────────────────────────────────────

  getAll(): Promise<TicketResponse[]> {
    return request<TicketResponse[]>('/api/tickets');
  },

  getById(id: number): Promise<TicketResponse> {
    return request<TicketResponse>(`/api/tickets/${id}`);
  },

  create(data: CreateTicketRequest): Promise<TicketResponse> {
    return request<TicketResponse>('/api/tickets', {
      method: 'POST',
      body: data,
    });
  },

  assign(id: number, data: AssignTicketRequest): Promise<TicketResponse> {
    return request<TicketResponse>(`/api/tickets/${id}/assign`, {
      method: 'PUT',
      body: data,
    });
  },

  updateStatus(
    id: number,
    data: UpdateTicketStatusRequest
  ): Promise<TicketResponse> {
    return request<TicketResponse>(`/api/tickets/${id}/status`, {
      method: 'PUT',
      body: data,
    });
  },

  // ─── SLA ──────────────────────────────────────────────────────────────────

  getSlaStatus(id: number): Promise<SlaStatusResponse> {
    return request<SlaStatusResponse>(`/api/tickets/${id}/sla`);
  },

  // ─── Comments ─────────────────────────────────────────────────────────────

  getComments(ticketId: number): Promise<CommentResponse[]> {
    return request<CommentResponse[]>(`/api/tickets/${ticketId}/comments`);
  },

  addComment(
    ticketId: number,
    data: CreateCommentRequest
  ): Promise<CommentResponse> {
    return request<CommentResponse>(`/api/tickets/${ticketId}/comments`, {
      method: 'POST',
      body: data,
    });
  },
};

