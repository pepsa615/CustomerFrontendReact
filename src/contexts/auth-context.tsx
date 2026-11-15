import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiRequest } from '../api/client';

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
  login: (identifier: string, password: string) => Promise<IdentityUser>;
  logout: () => Promise<void>;
  isBootstrapping: boolean;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(null);
  const [isBootstrapping, setBootstrapping] = useState(true);
  const login = useCallback(async (identifier: string, password: string) => {
    const data = await apiRequest<{ user: IdentityUser; accessToken: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({
          identifier,
          password,
          sessionTransport: 'cookie',
          platform: 'web',
          deviceName: navigator.userAgent,
        }),
      },
    );
    setSession({ user: data.user, accessToken: data.accessToken });
    return data.user;
  }, []);
  const logout = useCallback(async () => {
    await apiRequest('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ sessionTransport: 'cookie' }),
    }).catch(() => undefined);
    setSession(null);
  }, []);
  useEffect(() => {
    apiRequest<{ accessToken: string }>('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ sessionTransport: 'cookie' }),
    })
      .then(async ({ accessToken }) => {
        const user = await apiRequest<IdentityUser>('/auth/me', {
          headers: { authorization: `Bearer ${accessToken}` },
        });
        setSession({ user, accessToken });
      })
      .catch(() => setSession(null))
      .finally(() => setBootstrapping(false));
  }, []);
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
