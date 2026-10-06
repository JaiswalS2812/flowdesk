import { request } from '@/lib/api-client';
import {
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UserResponse,
} from '@/types';

export const authService = {
  login(data: LoginRequest): Promise<LoginResponse> {
    return request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: data,
      auth: false,
    });
  },

  register(data: RegisterRequest): Promise<UserResponse> {
    return request<UserResponse>('/api/auth/register', {
      method: 'POST',
      body: data,
      auth: false,
    });
  },

  // The signed-in user's current role and department
  me(): Promise<UserResponse> {
    return request<UserResponse>('/api/auth/me');
  },

  // Signs out every existing session, including this one
  changePassword(data: ChangePasswordRequest): Promise<void> {
    return request<void>('/api/auth/change-password', {
      method: 'POST',
      body: data,
    });
  },
};

