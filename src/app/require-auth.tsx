import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';
import { Skeleton } from '../components/ui';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, isBootstrapping } = useAuth();
  const location = useLocation();
  if (isBootstrapping)
    return (
      <div className="m-6 grid gap-3">
        <Skeleton />
        <Skeleton className="h-32" />
      </div>
    );
  if (!session)
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  if (session && !session.user.emailVerified)
    return <Navigate to="/auth/verify-email" replace />;
  return children;
}
