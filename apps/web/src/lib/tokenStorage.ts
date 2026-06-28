/**
 * Armazenamento de tokens no cliente, com "lembrar de mim".
 * - Lembrar ligado (padrão): localStorage (persiste após fechar o navegador).
 * - Lembrar desligado: sessionStorage (some ao fechar a aba/navegador).
 * A leitura sempre olha os dois, então a sessão é restaurada de onde estiver.
 */
const ACCESS_KEY = 'pp.accessToken';
const REFRESH_KEY = 'pp.refreshToken';
const REMEMBER_KEY = 'pp.remember';

function remembered(): boolean {
  return localStorage.getItem(REMEMBER_KEY) !== '0'; // padrão: true
}
function primary(): Storage {
  return remembered() ? localStorage : sessionStorage;
}
function secondary(): Storage {
  return remembered() ? sessionStorage : localStorage;
}

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_KEY) ?? sessionStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY) ?? sessionStorage.getItem(REFRESH_KEY),
  isRemembered: () => remembered(),
  setRemember: (value: boolean) => localStorage.setItem(REMEMBER_KEY, value ? '1' : '0'),
  set: (accessToken: string, refreshToken: string) => {
    const p = primary();
    p.setItem(ACCESS_KEY, accessToken);
    p.setItem(REFRESH_KEY, refreshToken);
    const o = secondary();
    o.removeItem(ACCESS_KEY);
    o.removeItem(REFRESH_KEY);
  },
  setAccess: (accessToken: string) => {
    primary().setItem(ACCESS_KEY, accessToken);
  },
  clear: () => {
    for (const s of [localStorage, sessionStorage]) {
      s.removeItem(ACCESS_KEY);
      s.removeItem(REFRESH_KEY);
    }
  },
};
