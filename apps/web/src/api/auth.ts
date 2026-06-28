import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
  PublicUser,
} from '@pokerpath/shared';
import { apiRequest } from '../lib/api.js';
import { tokenStorage } from '../lib/tokenStorage.js';

/** Funções de autenticação que falam com a API. */
export const authApi = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const res = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: input,
      auth: false,
    });
    tokenStorage.set(res.accessToken, res.refreshToken);
    return res;
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    const res = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: input,
      auth: false,
    });
    tokenStorage.set(res.accessToken, res.refreshToken);
    return res;
  },

  async me(): Promise<PublicUser> {
    const res = await apiRequest<{ user: PublicUser }>('/auth/me');
    return res.user;
  },

  async logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefresh();
    if (refreshToken) {
      await apiRequest('/auth/logout', {
        method: 'POST',
        body: { refreshToken },
        auth: false,
      }).catch(() => undefined);
    }
    tokenStorage.clear();
  },
};
