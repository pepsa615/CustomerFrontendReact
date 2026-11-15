import { Outlet } from 'react-router-dom';
export function AuthLayout() {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-surface lg:grid lg:grid-cols-[minmax(320px,0.8fr)_1.2fr] lg:bg-background">
      <aside className="relative hidden overflow-hidden bg-primary p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="text-2xl font-black tracking-tight">PEPSA</div>
        <div>
          <p className="max-w-sm text-4xl font-semibold leading-tight">
            Deliver smarter. Move money safely.
          </p>
          <p className="mt-4 max-w-sm text-white/75">
            One secure account for deliveries, wallet services and your
            business.
          </p>
        </div>
        <p className="text-sm text-white/60">
          Fast. Reliable. Built around you.
        </p>
      </aside>
      <section className="flex min-h-dvh justify-center px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] sm:items-center sm:p-8">
        <div className="w-full max-w-lg">
          <div className="mb-8 hidden text-center text-2xl font-black text-primary sm:block lg:hidden">
            PEPSA
          </div>
          <Outlet />
        </div>
      </section>
    </main>
  );
}
