import {
  ArrowDownToLine,
  Eye,
  EyeOff,
  History,
  Phone,
  ReceiptText,
  Send,
  Smartphone,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { WalletOverview, WalletTransaction } from '../api';
import { formatHistoryWhen, money, statusTone, transactionTitle } from '../wallet-format';
import { Card } from '../../../components/ui';

const quickActions = [
  { id: 'transfer', label: 'Transfer', icon: Send },
  { id: 'deposit', label: 'Deposit', icon: ArrowDownToLine },
  { id: 'airtime', label: 'Top-up', icon: Smartphone },
  { id: 'bills', label: 'Bills', icon: ReceiptText },
  { id: 'history', label: 'History', icon: History },
] as const;

export function WalletHomeView({
  wallet,
  balanceVisible,
  onToggleBalance,
  preview,
  onOpenReceipt,
}: {
  wallet: WalletOverview;
  balanceVisible: boolean;
  onToggleBalance: () => void;
  preview: WalletTransaction[];
  onOpenReceipt: (tx: WalletTransaction) => void;
}) {
  return (
    <div className="grid gap-6">
      <Card className="overflow-hidden border-0 bg-primary p-0 text-primary-foreground shadow-xl">
        <div className="p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            Wallet balance
          </p>
          <div className="mt-3 flex items-center gap-3">
            <p className="text-4xl font-bold">
              {balanceVisible
                ? money(wallet.availableBalance)
                : '••••••••'}
            </p>
            <button
              type="button"
              aria-label={balanceVisible ? 'Hide balance' : 'Show balance'}
              onClick={onToggleBalance}
            >
              {balanceVisible ? <EyeOff /> : <Eye />}
            </button>
          </div>
          <p className="mt-2 text-sm text-white/70">
            {wallet.status === 'ACTIVE'
              ? 'Available balance'
              : `Wallet status: ${wallet.status}`}
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {quickActions.map(({ id, label, icon: Icon }) => (
          <Link
            key={id}
            to={`/app/wallet?action=${id}`}
            className="rounded-2xl border bg-surface p-3 text-center transition hover:border-primary hover:bg-primary-soft sm:p-4"
          >
            <Icon className="mx-auto text-primary" size={22} />
            <span className="mt-2 block text-[0.7rem] font-semibold leading-tight sm:text-xs">
              {label}
            </span>
          </Link>
        ))}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Recent activity</h2>
          <Link
            to="/app/wallet?action=history"
            className="text-sm font-semibold text-primary"
          >
            See all
          </Link>
        </div>
        {preview.length ? (
          <ul className="divide-y rounded-2xl border bg-surface">
            {preview.map((tx) => (
              <li key={tx.id}>
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left"
                  onClick={() => onOpenReceipt(tx)}
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 truncate font-medium text-muted">
                      {tx.type.includes('AIRTIME') || tx.type.includes('DATA') ? (
                        <Phone size={16} className="shrink-0 text-primary" />
                      ) : null}
                      {transactionTitle(tx)}
                    </span>
                    <span className="mt-1 block text-xs text-muted">
                      {formatHistoryWhen(tx.createdAt)}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-bold">{money(tx.amount)}</span>
                    <span
                      className={`text-xs capitalize ${statusTone(tx.status)}`}
                    >
                      {tx.status.toLowerCase()}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border bg-surface px-4 py-10 text-center text-sm text-muted">
            No transaction records found
          </p>
        )}
      </section>
    </div>
  );
}