import { request } from '@/lib/api-client';
import { toQuery } from '@/lib/query';
import {
  PageResponse,
  TicketQuery,
  TicketSummary,
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

  // Only the tickets the signed-in user may see; filtered, sorted and paged by the server
  getPage(query: TicketQuery = {}): Promise<PageResponse<TicketResponse>> {
    return request<PageResponse<TicketResponse>>(`/api/tickets${toQuery(query)}`);
  },

  getSummary(): Promise<TicketSummary> {
    return request<TicketSummary>('/api/tickets/summary');
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

