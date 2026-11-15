import type { ReactNode } from 'react';

export function Page({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-6 sm:p-6 lg:p-8">
      <header className="mb-6 grid gap-4 sm:flex sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[1.625rem] font-bold leading-tight tracking-tight sm:text-3xl">
            {title}
          </h1>
          {description && <p className="mt-2 text-muted">{description}</p>}
        </div>
        {actions}
      </header>
      {children}
    </main>
  );
}
