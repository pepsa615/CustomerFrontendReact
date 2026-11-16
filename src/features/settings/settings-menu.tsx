import type { ComponentType } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

export function SettingsMenuRow({
  to,
  label,
  icon: Icon,
  className,
}: {
  to: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        'flex min-h-[3.25rem] items-center gap-3 rounded-2xl border border-transparent bg-surface px-4 py-3 shadow-sm transition hover:border-border hover:bg-surface-muted',
        className,
      )}
    >
      <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon size={18} />
      </span>
      <span className="flex-1 text-sm font-semibold sm:text-base">{label}</span>
      <ChevronRight aria-hidden size={18} className="text-muted" />
    </Link>
  );
}

export function SettingsMenuGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border/80 bg-primary-soft/25 p-3 sm:p-4 dark:bg-primary/5">
      <h2 className="mb-3 px-2 text-sm font-bold uppercase tracking-wide text-muted">
        {title}
      </h2>
      <div className="grid gap-2">{children}</div>
    </section>
  );
}