import { Outlet } from 'react-router-dom';
export function PublicLayout() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b bg-surface px-4 py-4">
        <div className="mx-auto max-w-3xl text-xl font-black text-primary">
          PEPSA
        </div>
      </header>
      <Outlet />
    </div>
  );
}
