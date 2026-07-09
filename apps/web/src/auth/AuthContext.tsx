import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type {
  AuthResponse,
  LoginInput,
  PublicUser,
  RegisterInput,
} from '@pokerpath/shared';
import { authApi } from '../api/auth.js';
import { ApiError } from '../lib/api.js';
import { tokenStorage } from '../lib/tokenStorage.js';

/**
 * Contexto de autenticação.
 * Mantém o usuário atual, expõe login/register/logout e um estado de loading
 * inicial enquanto restaura a sessão a partir do token salvo.
 */

interface AuthContextValue {
  user: PublicUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: PublicUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaura a sessão ao montar, se houver token salvo. Erros de REDE (API
  // fora do ar, reiniciando) não derrubam a sessão: tenta de novo algumas
  // vezes e só limpa os tokens se o servidor rejeitar de verdade (401/403).
  useEffect(() => {
    let cancelled = false;
    async function restore() {
      if (!tokenStorage.getAccess() && !tokenStorage.getRefresh()) {
        setIsLoading(false);
        return;
      }
      for (let attempt = 0; attempt < 3 && !cancelled; attempt++) {
        try {
          const me = await authApi.me();
          if (!cancelled) setUser(me);
          break;
        } catch (err) {
          const rejected = err instanceof ApiError && (err.status === 401 || err.status === 403);
          if (rejected) {
            tokenStorage.clear();
            break;
          }
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
      if (!cancelled) setIsLoading(false);
    }
    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  function applyAuth(res: AuthResponse) {
    setUser(res.user);
  }

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login: async (input) => applyAuth(await authApi.login(input)),
    register: async (input) => applyAuth(await authApi.register(input)),
    logout: async () => {
      await authApi.logout();
      setUser(null);
    },
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
