import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brand } from '../components/shared/brand';
import { ResponsiveShell } from '../components/shared/responsive-shell';
import { useAuth } from '../contexts/auth-context';
import { hasCompletedIntro } from '../features/identity/intro-storage';
import { IntroPagination } from '../features/identity/intro-pagination';
import { INTRO_SLIDES } from '../features/identity/intro-slides';
import { postAuthDestination } from '../features/orders/order-intent';

const MINIMUM_BRAND_SPLASH_MS = 900;

export function Component() {
  const navigate = useNavigate();
  const { session, isBootstrapping } = useAuth();

  useEffect(() => {
    if (isBootstrapping) return;
    const startedAt = Date.now();
    let active = true;

    const timer = window.setTimeout(() => {
      if (!active) return;
      if (session) {
        navigate(postAuthDestination(), { replace: true });
        return;
      }
      navigate(hasCompletedIntro() ? '/auth/login' : '/welcome', { replace: true });
    }, Math.max(0, MINIMUM_BRAND_SPLASH_MS - (Date.now() - startedAt)));

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [isBootstrapping, navigate, session]);

  return (
    <ResponsiveShell showThemeToggle={false}>
      <main className="relative flex min-h-dvh items-center justify-center bg-surface px-6 xl:min-h-[calc(100dvh-3rem)]">
        <Brand className="h-12 w-auto sm:h-14" />
        <IntroPagination
          total={INTRO_SLIDES.length}
          activeIndex={0}
          onSelect={() => undefined}
          className="pointer-events-none absolute inset-x-0 bottom-[max(2.5rem,env(safe-area-inset-bottom))]"
        />
      </main>
    </ResponsiveShell>
  );
}