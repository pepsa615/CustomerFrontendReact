import { Outlet } from 'react-router-dom';
import { Brand } from '../components/shared/brand';
export function AuthLayout() {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-surface lg:grid lg:grid-cols-[minmax(320px,0.8fr)_1.2fr] lg:bg-background">
      <aside className="relative hidden overflow-hidden bg-primary p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Brand inverse className="text-2xl" />
        <div>
          <p className="max-w-sm text-4xl font-semibold leading-tight">
            Deliver smarter. Track every movement.
          </p>
          <p className="mt-4 max-w-sm text-white/75">
            Book reliable deliveries, follow them live, and manage personal
            or business logistics from one place.
          </p>
        </div>
        <p className="text-sm text-white/60">
          Fast. Reliable. Built around you.
        </p>
      </aside>
      <section className="flex min-h-dvh justify-center px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] sm:items-center sm:p-8">
        <div className="w-full max-w-lg">
          <div className="mb-8 hidden justify-center sm:flex lg:hidden">
            <Brand className="text-2xl" />
          </div>
          <Outlet />
        </div>
      </section>
    </main>
  );
}
