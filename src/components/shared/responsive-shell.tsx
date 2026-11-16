import type { ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useTheme } from '../../contexts/theme-context';

export function ResponsiveShell({
  children,
  className,
  showThemeToggle = true,
}: {
  children: ReactNode;
  className?: string;
  showThemeToggle?: boolean;
}) {
  const { resolved, setTheme } = useTheme();
  const next = resolved === 'dark' ? 'light' : 'dark';

  return (
    <div className={cn('min-h-dvh bg-background text-foreground xl:p-6', className)}>
      <div className="relative mx-auto w-full min-h-dvh xl:min-h-[calc(100dvh-3rem)] xl:max-w-6xl xl:overflow-hidden xl:rounded-3xl xl:border xl:border-border xl:bg-surface xl:shadow-xl">
        {showThemeToggle ? (
          <button
            type="button"
            className="absolute right-4 top-4 z-20 grid size-11 place-items-center rounded-xl border border-border bg-surface text-foreground shadow-sm transition hover:bg-surface-muted xl:right-6 xl:top-6"
            aria-label={`Switch to ${next} mode`}
            onClick={() => setTheme(next)}
          >
            {resolved === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        ) : null}
        {children}
      </div>
    </div>
  );
}