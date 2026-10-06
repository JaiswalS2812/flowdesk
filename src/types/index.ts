// ─── Enums (must match backend exactly) ─────────────────────────────────────

export type Role = 'EMPLOYEE' | 'SUPPORT_ENGINEER' | 'MANAGER' | 'ADMIN';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SlaEscalationLevel = 'NONE' | 'WARNING' | 'BREACHED';

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  department: string;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: Role;
  department: string;
  createdAt: string; // ISO datetime string from backend
  active: boolean;
  deactivatedAt: string | null;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  user: UserResponse;
}

export interface AdminUpdateUserRequest {
  role: Role;
  department: string;
}

// ─── Tickets ─────────────────────────────────────────────────────────────────

export interface TicketResponse {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdBy: string;       // email
  assignedTo: string | null;  // email or null
  department: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  responseDeadline: string | null;
  resolutionDeadline: string | null;
  respondedAt: string | null;
  responseBreached: boolean;
  resolutionBreached: boolean;
  escalationLevel: SlaEscalationLevel;
}

export interface AdminUpdateUserRequest {
  role: Role;
  department: string;
}

// Department is not sent: the backend assigns the creator's department
export interface CreateTicketRequest {
  title: string;
  description: string;
  priority: TicketPriority;
}

export interface AssignTicketRequest {
  assignedTo: string; // email
}

export interface UpdateTicketStatusRequest {
  status: TicketStatus;
}

// ─── Comments ────────────────────────────────────────────────────────────────

export interface CommentResponse {
  id: number;
  ticketId: number;
  authorEmail: string;
  content: string;
  createdAt: string;
}

export interface CreateCommentRequest {
  content: string;
}

// ─── SLA ─────────────────────────────────────────────────────────────────────

export interface SlaStatusResponse {
  responseBreached: boolean;
  resolutionBreached: boolean;
  escalationLevel: SlaEscalationLevel;
}

// ─── API Errors ──────────────────────────────────────────────────────────────

export interface ApiValidationError {
  error: string;
  fields?: Record<string, string>;
  message?: string;
}

export interface ApiError {
  status: number;
  message: string;
  fields?: Record<string, string>;
}

// ─── Audit Log / Activity ───────────────────────────────────────────────────

export interface AuditLogResponse {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  performedBy: string;
  details: string;
  createdAt: string;
}

// ─── SLA Policies (Admin) ───────────────────────────────────────────────────

export interface SlaPolicyResponse {
  id: number;
  priority: TicketPriority;
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
  active: boolean;
}

export interface UpdateSlaPolicyRequest {
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
}

// ─── Notifications ──────────────────────────────────────────────────────────

export type NotificationType =
  | 'TICKET_ASSIGNED'
  | 'TICKET_STATUS_CHANGED'
  | 'NEW_COMMENT'
  | 'TICKET_RESOLVED'
  | 'TICKET_CLOSED'
  | 'SLA_WARNING'
  | 'SLA_BREACHED'
  | 'USER_ROLE_CHANGED'
  | 'USER_DEPARTMENT_CHANGED';

export interface NotificationResponse {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: number;
  read: boolean;
  createdAt: string;
}



// ─── Paging and summaries ───────────────────────────────────────────────────

export interface PageResponse<T> {
  content: T[];
  page: number;       // zero-based
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PageQuery {
  page?: number;
  size?: number;
}

export type TicketSortKey = 'id' | 'title' | 'status' | 'priority' | 'department' | 'createdAt' | 'updatedAt';

export interface TicketQuery extends PageQuery {
  status?: TicketStatus;
  priority?: TicketPriority;
  search?: string;
  atRisk?: boolean;
  sort?: TicketSortKey;
  direction?: 'asc' | 'desc';
}

export interface TicketSummary {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  cancelled: number;
  breached: number;
  atRisk: number;
  byPriority: Record<TicketPriority, number>;
}

export interface ActivitySummary {
  total: number;
  slaBreaches: number;
  statusChanges: number;
  assignments: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
