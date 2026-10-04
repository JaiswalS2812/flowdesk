import { ApiError, ApiValidationError } from '@/types';


// ─── Token helpers ────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('flowdesk_token');
}

export function setToken(token: string): void {
  localStorage.setItem('flowdesk_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('flowdesk_token');
}

// ─── Error parsing ────────────────────────────────────────────────────────────

async function parseError(response: Response): Promise<ApiError> {
  let body: ApiValidationError | null = null;
  try {
    body = await response.json();
  } catch {
    // not JSON
  }

  return {
    status: response.status,
    message:
      body?.error ||
      body?.message ||
      getDefaultMessage(response.status),
    fields: body?.fields,
  };
}

function getDefaultMessage(status: number): string {
  switch (status) {
    case 400: return 'Bad request. Please check your input.';
    case 401: return 'You are not authenticated. Please log in.';
    case 403: return 'You do not have permission to perform this action.';
    case 404: return 'The requested resource was not found.';
    case 409: return 'A conflict occurred. The resource may already exist.';
    default:  return 'An unexpected error occurred. Please try again.';
  }
}

// ─── Core request function ────────────────────────────────────────────────────

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw {
      status: 0,
      message: 'Network error. Please check your connection.',
    } as ApiError;
  }

  if (!response.ok) {
    const error = await parseError(response);

    // Auto-redirect on 401
    if (error.status === 401 && typeof window !== 'undefined') {
      removeToken();
      window.location.href = '/login';
    }

    throw error;
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

