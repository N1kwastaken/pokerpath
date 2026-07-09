import { tokenStorage } from './tokenStorage.js';

/**
 * Cliente HTTP da API.
 * - Injeta o access token automaticamente.
 * - Em caso de 401, tenta refresh transparente uma vez e repete a request.
 * - Centraliza o parsing de erros no formato { error, code }.
 */

const BASE_URL = '/api';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean; // anexa o access token (default true)
  _retried?: boolean; // controle interno de retry pós-refresh
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) return false;

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    // Só descarta a sessão se o refresh foi REJEITADO (401/403). Erro de rede
    // ou servidor reiniciando (5xx) não pode deslogar quem pediu "lembrar".
    if (res.status === 401 || res.status === 403) tokenStorage.clear();
    return false;
  }

  const data = (await res.json()) as {
    accessToken: string;
    refreshToken: string;
  };
  tokenStorage.set(data.accessToken, data.refreshToken);
  return true;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, auth = true, _retried = false } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (auth) {
    const token = tokenStorage.getAccess();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Refresh transparente em 401 (uma única tentativa).
  if (res.status === 401 && auth && !_retried) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, _retried: true });
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      res.status,
      (data as { error?: string }).error ?? 'Erro inesperado',
      (data as { code?: string }).code,
    );
  }

  return data as T;
}
