import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function OrderFlowHeader({
  title,
  step,
  steps,
  backTo,
  onBack,
}: {
  title: string;
  step: number;
  steps: number;
  backTo?: string;
  onBack?: () => void;
}) {
  return (
    <header className="mb-6">
      <div className="mb-4 flex items-center gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="grid size-11 place-items-center rounded-full bg-primary-soft text-primary"
            aria-label="Go back"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
        ) : backTo ? (
          <Link
            to={backTo}
            className="grid size-11 place-items-center rounded-full bg-primary-soft text-primary"
            aria-label="Go back"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </Link>
        ) : null}
        <h1 className="flex-1 text-xl font-bold">{title}</h1>
      </div>
      <div className="flex gap-2" aria-label="Progress">
        {Array.from({ length: steps }).map((_, index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-primary' : 'bg-surface-muted'}`}
          />
        ))}
      </div>
    </header>
  );
}