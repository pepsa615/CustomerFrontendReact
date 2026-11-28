import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ApiError, apiRequest } from '../api/client';

export type IdentityUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  onboardingStatus: 'EMAIL_PENDING' | 'PROFILE_PENDING' | 'COMPLETE';
};
type Session = { user: IdentityUser; accessToken: string } | null;
type AuthContextValue = {
  session: Session;
  setSession: (session: Session) => void;
  login: (
    identifier: string,
    password: string,
    rememberMe: boolean,
  ) => Promise<IdentityUser>;
  logout: () => Promise<void>;
  isBootstrapping: boolean;
};
const AuthContext = createContext<AuthContextValue | null>(null);

let refreshInFlight: Promise<{ accessToken: string }> | null = null;

async function csrfToken() {
  return apiRequest<{ csrfToken: string }>('/auth/csrf-token');
}

function refreshBrowserSession() {
  if (refreshInFlight) return refreshInFlight;
  const rotate = async () => {
    const { csrfToken: token } = await csrfToken();
    return apiRequest<{ accessToken: string }>('/auth/refresh-token', {
      method: 'POST',
      headers: { 'x-csrf-token': token },
      body: JSON.stringify({
        sessionTransport: 'cookie',
        rememberMe: localStorage.getItem('pepsa.remember-me') === 'true',
      }),
    });
  };
  const locks = navigator.locks;
  const coordinated = locks
      ? (locks.request(
        'pepsa-customer-session-refresh',
        rotate,
      ) as unknown as Promise<{ accessToken: string }>)
    : rotate();
  refreshInFlight = coordinated.finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

function refreshDelay(accessToken: string) {
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1].replaceAll('-', '+').replaceAll('_', '/'))) as { exp?: number };
    return Math.max(15_000, (payload.exp ?? 0) * 1000 - Date.now() - 60_000);
  } catch {
    return 10 * 60 * 1000;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(null);
  const sessionRef = useRef<Session>(null);
  const [isBootstrapping, setBootstrapping] = useState(true);
  const login = useCallback(
    async (identifier: string, password: string, rememberMe: boolean) => {
      const data = await apiRequest<{
        user: IdentityUser;
        accessToken: string;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier,
          password,
          sessionTransport: 'cookie',
          platform: 'web',
          deviceName: navigator.userAgent.slice(0, 100),
          rememberMe,
        }),
      });
      setSession({ user: data.user, accessToken: data.accessToken });
      sessionRef.current = { user: data.user, accessToken: data.accessToken };
      if (rememberMe) localStorage.setItem('pepsa.remember-me', 'true');
      else localStorage.removeItem('pepsa.remember-me');
      return data.user;
    },
    [],
  );
  const logout = useCallback(async () => {
    await csrfToken()
      .then(({ csrfToken: token }) =>
        apiRequest('/auth/logout', {
          method: 'POST',
          headers: { 'x-csrf-token': token },
          body: JSON.stringify({ sessionTransport: 'cookie' }),
        }),
      )
      .catch(() => undefined);
    setSession(null);
    sessionRef.current = null;
    localStorage.removeItem('pepsa.remember-me');
  }, []);
  useEffect(() => {
    refreshBrowserSession()
      .then(async ({ accessToken }) => {
        const user = await apiRequest<IdentityUser>('/auth/me', {
          headers: { authorization: `Bearer ${accessToken}` },
        });
        setSession({ user, accessToken });
        sessionRef.current = { user, accessToken };
      })
      .catch(() => setSession(null))
      .finally(() => setBootstrapping(false));
  }, []);
  useEffect(() => {
    if (!session) return;
    const renew = () => {
      void refreshBrowserSession()
        .then(({ accessToken }) => {
          const current = sessionRef.current;
          if (!current) return;
          const next = { ...current, accessToken };
          sessionRef.current = next;
          setSession(next);
        })
        .catch((error: unknown) => {
          if (error instanceof ApiError && [401, 403].includes(error.status)) {
            sessionRef.current = null;
            setSession(null);
          }
        });
    };
    const timer = window.setTimeout(renew, refreshDelay(session.accessToken));
    const onVisible = () => {
      if (document.visibilityState === 'visible' && refreshDelay(session.accessToken) <= 15_000) renew();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [session]);
  const value = useMemo(
    () => ({ session, setSession, login, logout, isBootstrapping }),
    [session, login, logout, isBootstrapping],
  );
  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const value = use(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
