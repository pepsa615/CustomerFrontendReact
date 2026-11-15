import { useCallback, useEffect, useState } from 'react';
import { Button, EmptyState, ErrorState, Skeleton } from '../components/ui';
import { Page } from '../components/shared/page';
import { apiRequest } from '../api/client';
import { useAuth } from '../contexts/auth-context';
type DeviceSession = {
  id: string;
  deviceName?: string;
  platform?: string;
  lastUsedAt: string;
  expiresAt: string;
};
export function Component() {
  const { session, logout } = useAuth();
  const [items, setItems] = useState<DeviceSession[] | null>(null);
  const [error, setError] = useState('');
  const accessToken = session?.accessToken ?? '';
  const load = useCallback(
    () =>
      apiRequest<DeviceSession[]>('/auth/sessions', {
        headers: { authorization: `Bearer ${accessToken}` },
      })
        .then(setItems)
        .catch((cause) =>
          setError(
            cause instanceof Error ? cause.message : 'Could not load sessions',
          ),
        ),
    [accessToken],
  );
  useEffect(() => {
    void load();
  }, [load]);
  async function revoke(id: string) {
    await apiRequest(`/auth/sessions/${id}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    void load();
  }
  async function revokeAll() {
    await apiRequest('/auth/sessions/all', {
      method: 'DELETE',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    await logout();
  }
  return (
    <Page
      title="Devices and sessions"
      description="Review where your PEPSA account is signed in and revoke access you do not recognize."
    >
      {error ? (
        <ErrorState message={error} retry={load} />
      ) : !items ? (
        <Skeleton className="h-40" />
      ) : items.length === 0 ? (
        <EmptyState
          title="No active sessions"
          description="Sign in again to create a new session."
        />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="grid min-w-0 gap-4 rounded-2xl border bg-surface p-4 sm:flex sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <h2 className="break-words font-semibold">
                  {item.deviceName || item.platform || 'Unknown device'}
                </h2>
                <p className="text-sm text-muted">
                  Last active {new Date(item.lastUsedAt).toLocaleString()}
                </p>
              </div>
              <Button
                className="w-full sm:w-auto"
                variant="secondary"
                onClick={() => revoke(item.id)}
              >
                Revoke
              </Button>
            </article>
          ))}
          <Button
            variant="danger"
            className="mt-3 w-full sm:w-auto sm:justify-self-start"
            onClick={revokeAll}
          >
            Sign out everywhere
          </Button>
        </div>
      )}
    </Page>
  );
}
