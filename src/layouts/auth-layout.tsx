import { Outlet, useLocation } from 'react-router-dom';
import { Brand } from '../components/shared/brand';
import { ResponsiveShell } from '../components/shared/responsive-shell';
import { INTRO_SLIDES } from '../features/identity/intro-slides';

export function AuthLayout() {
  const { pathname } = useLocation();
  const fullBleed = pathname.includes('/auth/setup/location');

  if (fullBleed) {
    return (
      <div className="min-h-dvh bg-background">
        <Outlet />
      </div>
    );
  }

  return (
    <ResponsiveShell>
      <main className="grid min-h-dvh bg-surface lg:grid-cols-[minmax(380px,0.94fr)_minmax(0,1.06fr)] xl:min-h-[calc(100dvh-3rem)]">
        <section className="flex min-h-dvh justify-center px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] sm:items-center sm:px-10 lg:border-r lg:border-border lg:px-12 lg:py-10 xl:px-16 xl:py-14">
          <div className="w-full max-w-md xl:max-w-lg">
            <div className="mb-8 flex items-center justify-between gap-4 lg:hidden">
              <Brand className="h-7 w-auto" />
            </div>
            <Outlet />
          </div>
        </section>
        <aside
          aria-hidden
          className="relative hidden overflow-hidden bg-primary-soft lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-14"
        >
          <Brand className="h-8 w-auto" />
          <div className="mx-auto flex w-full max-w-xl flex-col items-center text-center">
            <img
              src={INTRO_SLIDES[0].image}
              alt=""
              className="max-h-[min(46vh,440px)] w-full object-contain"
            />
            <p className="mt-8 text-3xl font-semibold leading-tight text-primary xl:text-[2rem]">
              Deliver, pay, and track in one app
            </p>
            <p className="mt-3 max-w-md text-base leading-6 text-muted xl:text-lg">
              Shop with confidence, send parcels with ease, and manage your wallet
              from web or mobile.
            </p>
          </div>
          <p className="text-sm text-muted">Secure payments. Reliable delivery.</p>
        </aside>
      </main>
    </ResponsiveShell>
  );
}