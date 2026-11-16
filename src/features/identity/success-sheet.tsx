import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '../../components/ui';

export function SuccessSheet({
  title,
  open,
  onContinue,
  children,
}: {
  title: string;
  open: boolean;
  onContinue: () => void;
  children?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-black/45 p-0 sm:place-items-center sm:p-4"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-lg rounded-t-3xl border-t border-border bg-surface px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8 sm:rounded-3xl sm:border sm:p-8"
      >
        <div className="flex flex-col items-center text-center">
          <SuccessMark />
          <h2 className="mt-6 text-lg font-bold text-foreground">{title}</h2>
          {children ? <p className="mt-2 text-sm text-muted">{children}</p> : null}
          <Button
            type="button"
            className="mt-8 w-full rounded-2xl py-3.5 text-base"
            onClick={onContinue}
          >
            Continue
          </Button>
        </div>
      </section>
    </div>
  );
}

function SuccessMark() {
  return (
    <div className="relative grid size-32 place-items-center">
      <span
        aria-hidden
        className="absolute inset-0 rounded-full bg-primary-soft"
      />
      <span
        aria-hidden
        className="grid size-20 place-items-center rounded-full bg-primary text-primary-foreground shadow-md"
        style={{
          clipPath:
            'polygon(50% 0%, 61% 11%, 75% 8%, 84% 20%, 98% 22%, 95% 38%, 100% 50%, 92% 62%, 95% 78%, 82% 88%, 75% 100%, 60% 97%, 50% 100%, 38% 94%, 25% 98%, 15% 86%, 2% 84%, 6% 68%, 0% 55%, 9% 42%, 4% 28%, 18% 20%, 27% 8%, 40% 11%)',
        }}
      >
        <Check size={34} strokeWidth={2.5} aria-hidden />
      </span>
    </div>
  );
}