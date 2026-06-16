// Token storage supporting "remember me":
// persistent (localStorage) when remembered, session-only (sessionStorage) otherwise.
const TOKEN = 'token';
const REFRESH = 'refreshToken';
const REMEMBER = 'rememberMe';
const EMAIL = 'rememberedEmail';

function isRemembered(): boolean {
  return typeof window !== 'undefined' && localStorage.getItem(REMEMBER) === '1';
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN) || sessionStorage.getItem(TOKEN);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH) || sessionStorage.getItem(REFRESH);
}

// Write tokens. Pass `remember` on login; omit it for refreshes (it reuses the saved preference).
export function setTokens(token: string, refreshToken?: string | null, remember?: boolean): void {
  if (typeof window === 'undefined') return;
  const persist = remember === undefined ? isRemembered() : remember;
  if (remember !== undefined) localStorage.setItem(REMEMBER, remember ? '1' : '0');
  const store = persist ? localStorage : sessionStorage;
  const other = persist ? sessionStorage : localStorage;
  store.setItem(TOKEN, token);
  other.removeItem(TOKEN);
  other.removeItem(REFRESH);
  if (refreshToken) {
    store.setItem(REFRESH, refreshToken);
  }
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  [localStorage, sessionStorage].forEach((s) => {
    s.removeItem(TOKEN);
    s.removeItem(REFRESH);
  });
  localStorage.removeItem(REMEMBER);
}

export function setRememberedEmail(email: string | null): void {
  if (typeof window === 'undefined') return;
  if (email) localStorage.setItem(EMAIL, email);
  else localStorage.removeItem(EMAIL);
}

export function getRememberedEmail(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(EMAIL) || '';
}
