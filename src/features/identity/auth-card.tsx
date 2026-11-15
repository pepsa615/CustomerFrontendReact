import type { ReactNode } from 'react';
import { Card } from '../../components/ui';
export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="rounded-none border-0 bg-transparent p-0 shadow-none sm:rounded-3xl sm:bg-surface sm:p-8 sm:shadow-lg">
      <header className="mb-8">
        <h1 className="text-[1.625rem] font-semibold leading-tight tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-md text-base leading-6 text-muted">
          {description}
        </p>
      </header>
      {children}
    </Card>
  );
}
