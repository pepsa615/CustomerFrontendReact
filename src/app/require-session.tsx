import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Skeleton } from '../components/ui';
import { useAuth } from '../contexts/auth-context';

export function RequireSession({ children }: { children: ReactNode }) {
  const { session, isBootstrapping } = useAuth();
  const location = useLocation();
  if (isBootstrapping)
    return (
      <div className="grid gap-3 p-6">
        <Skeleton />
        <Skeleton className="h-32" />
      </div>
    );
  if (!session)
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  return children;
}