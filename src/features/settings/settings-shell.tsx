import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { cn } from '../../utils/cn';

export function SettingsShell({
  title,
  description,
  children,
  aside,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  const { section } = useParams();
  const backTo = section ? '/app/settings' : '/app';

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <header className="mb-6 flex items-start gap-3">
        <Link
          to={backTo}
          className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-surface text-primary shadow-sm transition hover:bg-surface-muted"
          aria-label="Go back"
        >
          <ChevronLeft size={22} />
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-muted">{description}</p>
          ) : null}
        </div>
      </header>

      <div
        className={cn(
          'grid gap-6',
          aside ? 'lg:grid-cols-[minmax(0,1fr)_minmax(260px,.85fr)] xl:grid-cols-[minmax(0,1fr)_300px]' : '',
        )}
      >
        <div className="min-w-0">{children}</div>
        {aside ? (
          <aside className="hidden lg:block">{aside}</aside>
        ) : null}
      </div>
    </div>
  );
}
