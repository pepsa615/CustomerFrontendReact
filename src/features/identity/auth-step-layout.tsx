import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

export function AuthStepLayout({
  title,
  description,
  backTo,
  children,
  className,
  headerClassName,
}: {
  title: string;
  description?: string;
  backTo?: string;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
}) {
  return (
    <div className={cn('w-full', className)}>
      {backTo ? (
        <Link
          to={backTo}
          className="mb-6 inline-flex size-10 items-center justify-center rounded-xl text-foreground hover:bg-surface-muted"
          aria-label="Go back"
        >
          <ChevronLeft size={22} aria-hidden />
        </Link>
      ) : null}
      <header className={cn('mb-8', headerClassName)}>
        <h1 className="text-[1.625rem] font-bold leading-tight tracking-tight text-foreground sm:text-[1.75rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-base leading-6 text-muted">{description}</p>
        ) : null}
      </header>
      {children}
    </div>
  );
}