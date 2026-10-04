import { request } from '@/lib/api-client';
import {
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
};

