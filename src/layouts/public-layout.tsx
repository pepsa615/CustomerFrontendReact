import { Outlet } from 'react-router-dom';
import { Brand } from '../components/shared/brand';
export function PublicLayout() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b bg-surface px-4 py-4">
        <div className="mx-auto max-w-3xl">
          <Brand className="h-7 w-auto" />
        </div>
      </header>
      <Outlet />
    </div>
  );
}
