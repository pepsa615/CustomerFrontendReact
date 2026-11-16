import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function WalletFlowHeader({
  title,
  backTo = '/app/wallet',
  historyHref = '/app/wallet?action=history',
  showHistory = false,
}: {
  title: string;
  backTo?: string;
  historyHref?: string;
  showHistory?: boolean;
}) {
  return (
    <header className="mb-8 flex items-center gap-3">
      <Link
        to={backTo}
        className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft text-primary transition hover:bg-primary/15"
        aria-label="Go back"
      >
        <ChevronLeft size={22} strokeWidth={2.5} />
      </Link>
      <h1 className="min-w-0 flex-1 text-xl font-bold tracking-tight text-foreground">
        {title}
      </h1>
      {showHistory ? (
        <Link
          to={historyHref}
          className="shrink-0 text-sm font-semibold text-primary"
        >
          History
        </Link>
      ) : null}
    </header>
  );
}