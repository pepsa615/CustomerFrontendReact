import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { ResponsiveShell } from '../../components/shared/responsive-shell';
import { INTRO_SLIDES } from './intro-slides';
import { markIntroComplete } from './intro-storage';
import { IntroPagination } from './intro-pagination';

export function WelcomeWorkspace() {
  const navigate = useNavigate();
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const slide = INTRO_SLIDES[index];

  const scrollToIndex = useCallback((nextIndex: number) => {
    setIndex(nextIndex);
    const track = trackRef.current;
    if (!track) return;
    const child = track.children[nextIndex] as HTMLElement | undefined;
    child?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, []);

  function onScroll() {
    const track = trackRef.current;
    if (!track?.clientWidth) return;
    const next = Math.round(track.scrollLeft / track.clientWidth);
    if (next !== index) setIndex(next);
  }

  function finish(destination: '/auth/sign-up' | '/auth/login') {
    markIntroComplete();
    navigate(destination, { replace: true });
  }

  const actions = (
    <div className="mx-auto w-full max-w-sm lg:max-w-md">
      <IntroPagination
        total={INTRO_SLIDES.length}
        activeIndex={index}
        onSelect={scrollToIndex}
        className="mb-8 lg:mb-10"
      />
      <Button
        type="button"
        className="w-full rounded-2xl py-3.5 text-base"
        onClick={() => finish('/auth/sign-up')}
      >
        Get started
      </Button>
      <button
        type="button"
        className="mt-1 min-h-12 w-full text-center text-base font-semibold text-foreground"
        onClick={() => finish('/auth/login')}
      >
        Continue as Guest
      </button>
    </div>
  );

  return (
    <ResponsiveShell>
      <main className="grid min-h-dvh bg-surface text-foreground lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] xl:min-h-[calc(100dvh-3rem)]">
        <section className="min-h-0 flex-1 lg:flex lg:flex-col lg:justify-center lg:px-14 lg:py-12 xl:px-16">
          <div
            ref={trackRef}
            onScroll={onScroll}
            className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden"
          >
            {INTRO_SLIDES.map((item) => (
              <article
                key={item.key}
                className="flex w-full shrink-0 snap-center flex-col px-6 pt-[max(2.5rem,env(safe-area-inset-top))]"
              >
                <SlideVisual item={item} />
                <SlideCopy item={item} className="mt-5" />
              </article>
            ))}
          </div>

          <article className="hidden lg:block">
            <SlideVisual item={slide} large />
            <SlideCopy item={slide} large className="mt-8" />
          </article>
        </section>

        <section className="flex flex-col justify-end border-t border-border px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 lg:justify-center lg:border-l lg:border-t-0 lg:px-12 lg:py-12 xl:px-14">
          {actions}
        </section>
      </main>
    </ResponsiveShell>
  );
}

function SlideVisual({
  item,
  large = false,
}: {
  item: (typeof INTRO_SLIDES)[number];
  large?: boolean;
}) {
  return (
    <div
      className={
        large
          ? 'flex h-[min(52vh,520px)] items-center justify-center xl:h-[min(56vh,560px)]'
          : 'flex h-[min(44vh,420px)] items-center justify-center'
      }
    >
      <img
        src={item.image}
        alt=""
        className="max-h-full w-full max-w-xl object-contain"
      />
    </div>
  );
}

function SlideCopy({
  item,
  large = false,
  className = '',
}: {
  item: (typeof INTRO_SLIDES)[number];
  large?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <h1
        className={
          large
            ? 'max-w-xl text-[1.75rem] font-semibold leading-tight text-primary xl:text-[2rem]'
            : 'mx-auto max-w-sm text-center text-[1.45rem] font-semibold leading-8 text-primary sm:text-[1.625rem]'
        }
      >
        {item.title}
      </h1>
      <p
        className={
          large
            ? 'mt-3 max-w-lg text-base leading-6 text-muted xl:text-lg'
            : 'mx-auto mt-3 max-w-xs text-center text-base leading-6 text-muted'
        }
      >
        {item.description}
      </p>
    </div>
  );
}