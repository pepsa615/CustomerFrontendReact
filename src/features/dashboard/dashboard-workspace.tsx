import { useState, type ComponentType } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowDownToLine,
  ArrowRightLeft,
  Box,
  BriefcaseBusiness,
  Clock3,
  Eye,
  EyeOff,
  History,
  Link2,
  MoreHorizontal,
  PackageCheck,
  ReceiptText,
  Smartphone,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert, Skeleton, Tabs } from '../../components/ui';
import { useAuth } from '../../contexts/auth-context';
import { formatMoney, orderApi, type Order } from '../orders/api';
import { walletApi } from '../wallet/api';

type Icon = ComponentType<{
  size?: number;
  className?: string;
  'aria-hidden'?: boolean;
}>;

const walletActions: Array<{ label: string; to: string; icon: Icon }> = [
  {
    label: 'Transfer',
    to: '/app/wallet?action=transfer',
    icon: ArrowRightLeft,
  },
  { label: 'Deposit', to: '/app/wallet?action=deposit', icon: ArrowDownToLine },
  { label: 'Top-up', to: '/app/wallet?action=airtime', icon: Smartphone },
  { label: 'Bills', to: '/app/wallet?action=bills', icon: ReceiptText },
  { label: 'History', to: '/app/wallet?action=history', icon: History },
];

const quickActions: Array<{ label: string; to: string; icon: Icon }> = [
  { label: 'Delivery', to: '/app/orders?create=true', icon: Box },
  { label: 'Share link', to: '/app/delivery-links', icon: Link2 },
  { label: 'Referral', to: '/app/settings/referrals', icon: UsersRound },
  { label: 'Business', to: '/app/business', icon: BriefcaseBusiness },
];

const terminalStatuses = new Set([
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
  'FAILED',
]);

function ActionLink({
  label,
  to,
  icon: Icon,
}: {
  label: string;
  to: string;
  icon: Icon;
}) {
  return (
    <Link
      to={to}
      className="group flex min-w-0 flex-col items-center gap-2 rounded-xl px-1 py-3 text-center text-xs font-medium text-white transition hover:bg-white/10 focus-visible:outline-white sm:text-sm"
    >
      <Icon size={24} aria-hidden />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function QuickLink({
  label,
  to,
  icon: Icon,
}: {
  label: string;
  to: string;
  icon: Icon;
}) {
  return (
    <Link
      to={to}
      className="group grid justify-items-center gap-2 text-center text-xs font-medium sm:text-sm"
    >
      <span className="grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm transition group-hover:-translate-y-0.5 group-hover:bg-primary-hover sm:size-16">
        <Icon size={28} aria-hidden />
      </span>
      <span>{label}</span>
    </Link>
  );
}

function readableStatus(status: Order['status']) {
  return status.charAt(0) + status.slice(1).toLowerCase().replaceAll('_', ' ');
}

function OrderRow({ order }: { order: Order }) {
  const date = new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(order.createdAt));

  return (
    <Link
      to={`/app/orders/${order.id}`}
      className="flex items-center gap-3 rounded-2xl bg-surface px-3 py-3 shadow-[0_5px_18px_rgba(40,42,65,0.08)] ring-1 ring-border/50 transition hover:-translate-y-0.5 hover:shadow-md sm:px-4"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full border border-primary/20 bg-primary-soft text-primary">
        <PackageCheck size={20} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">
          Order #{order.id.slice(-8).toUpperCase()}
        </span>
        <span className="block truncate text-xs text-muted">{date}</span>
      </span>
      <span className="min-w-0 text-right">
        <span className="block truncate text-sm font-bold text-primary">
          {formatMoney(order.amount)}
        </span>
        <span className="block text-xs text-muted">
          {readableStatus(order.status)}
        </span>
      </span>
    </Link>
  );
}

export function DashboardWorkspace() {
  const { session } = useAuth();
  const token = session!.accessToken;
  const firstName = session!.user.fullName.trim().split(/\s+/)[0] || 'there';
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [activityTab, setActivityTab] = useState('deliveries');
  const wallet = useQuery({
    queryKey: ['wallet', 'overview'],
    queryFn: () => walletApi.overview(token),
  });
  const orders = useQuery({
    queryKey: ['orders', 'dashboard'],
    queryFn: () => orderApi.list(token, 6),
  });
  const activeCount =
    orders.data?.filter((order) => !terminalStatuses.has(order.status))
      .length ?? 0;
  const balance = wallet.data
    ? new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: wallet.data.currency,
      }).format(Number(wallet.data.availableBalance) / 100)
    : null;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Welcome back</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {activeCount} active {activeCount === 1 ? 'delivery' : 'deliveries'}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
            Available balance
          </p>
          <div className="mt-1 flex items-center gap-2 sm:justify-end">
            {wallet.isPending ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <p className="text-2xl font-bold sm:text-3xl">
                {balanceVisible ? (balance ?? '—') : '••••••'}
              </p>
            )}
            <button
              type="button"
              className="grid size-10 place-items-center rounded-xl text-muted hover:bg-surface-muted hover:text-foreground"
              onClick={() => setBalanceVisible((visible) => !visible)}
              aria-label={
                balanceVisible ? 'Hide wallet balance' : 'Show wallet balance'
              }
            >
              {balanceVisible ? (
                <EyeOff size={19} aria-hidden />
              ) : (
                <Eye size={19} aria-hidden />
              )}
            </button>
          </div>
        </div>
      </section>

      {wallet.isError ? (
        <div className="mt-4">
          <Alert tone="danger" title="Wallet unavailable">
            Your balance could not be loaded. Delivery tools remain available.
          </Alert>
        </div>
      ) : null}

      <section
        aria-label="Wallet actions"
        className="mt-5 grid grid-cols-5 divide-x divide-white/15 overflow-hidden rounded-2xl bg-primary px-1 py-1 shadow-lg shadow-primary/10"
      >
        {walletActions.map((action) => (
          <ActionLink key={action.label} {...action} />
        ))}
      </section>

      <section className="mt-7">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Quick navigation</h2>
          <Link
            to="/app/orders"
            className="text-sm font-semibold text-primary hover:underline"
          >
            All orders
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-3 sm:max-w-2xl sm:gap-7">
          {quickActions.map((action) => (
            <QuickLink key={action.label} {...action} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            value={activityTab}
            onChange={setActivityTab}
            items={[
              { value: 'transactions', label: 'Recent transactions' },
              { value: 'deliveries', label: 'Recent deliveries' },
            ]}
          />
          <Link
            to={
              activityTab === 'transactions'
                ? '/app/wallet?action=history'
                : '/app/orders'
            }
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            See more <MoreHorizontal size={18} aria-hidden />
          </Link>
        </div>

        {activityTab === 'transactions' ? (
          <div className="mt-4 rounded-2xl border bg-surface p-6 text-center">
            <WalletCards
              className="mx-auto text-primary"
              size={32}
              aria-hidden
            />
            <h3 className="mt-3 font-semibold">Your wallet activity</h3>
            <p className="mt-1 text-sm text-muted">
              View deposits, transfers and bill payments in transaction history.
            </p>
            <Link
              className="mt-4 inline-flex font-semibold text-primary hover:underline"
              to="/app/wallet?action=history"
            >
              Open transaction history
            </Link>
          </div>
        ) : orders.isPending ? (
          <div className="mt-4 grid gap-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-[4.5rem] rounded-2xl" />
            ))}
          </div>
        ) : orders.isError ? (
          <div className="mt-4">
            <Alert tone="danger" title="Deliveries unavailable">
              We could not load recent deliveries. Please try again shortly.
            </Alert>
          </div>
        ) : orders.data?.length ? (
          <div className="mt-4 grid gap-3">
            {orders.data.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border bg-surface p-7 text-center">
            <Clock3 className="mx-auto text-primary" size={34} aria-hidden />
            <h3 className="mt-3 font-semibold">No deliveries yet</h3>
            <p className="mt-1 text-sm text-muted">
              Get a quote before placing your first delivery.
            </p>
            <Link
              to="/app/orders?create=true"
              className="mt-4 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              Get a delivery quote
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
