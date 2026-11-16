import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { walletApi, type WalletTransaction } from '../api';
import {
  formatHistoryWhen,
  money,
  statusTone,
  transactionTitle,
} from '../wallet-format';
import { WalletFlowHeader } from '../components/wallet-flow-header';
import { Alert, Button, EmptyState, ErrorState, Input } from '../../../components/ui';

export function WalletHistoryView({
  token,
  onOpenReceipt,
}: {
  token: string;
  onOpenReceipt: (tx: WalletTransaction) => void;
}) {
  const [mode, setMode] = useState<'list' | 'filter'>('list');
  const [search, setSearch] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const transactions = useQuery({
    queryKey: ['wallet-transactions', search],
    queryFn: () => walletApi.transactions(token, search),
    enabled: Boolean(token),
  });
  const statement = useMutation({
    mutationFn: () => {
      const fromIso = new Date(start).toISOString();
      const toIso = new Date(end).toISOString();
      return walletApi.emailStatement(token, { from: fromIso, to: toIso });
    },
  });

  const filtered = useMemo(() => {
    const items = transactions.data?.items ?? [];
    if (!start && !end) return items;
    const startMs = start ? new Date(start).setHours(0, 0, 0, 0) : null;
    const endMs = end ? new Date(end).setHours(23, 59, 59, 999) : null;
    return items.filter((tx) => {
      const created = new Date(tx.createdAt).getTime();
      if (startMs !== null && created < startMs) return false;
      if (endMs !== null && created > endMs) return false;
      return true;
    });
  }, [end, start, transactions.data?.items]);

  return (
    <div>
      <WalletFlowHeader title={mode === 'filter' ? 'Transaction History' : 'History'} />
      {mode === 'filter' ? (
        <div className="grid gap-5">
          <Input
            type="date"
            aria-label="Start date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            placeholder="Select Start Date"
          />
          <Input
            type="date"
            aria-label="End date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            placeholder="Select End Date"
          />
          <Button className="h-12 rounded-2xl" onClick={() => setMode('list')}>
            Search
          </Button>
          {statement.isError ? (
            <Alert tone="danger">{statement.error.message}</Alert>
          ) : null}
          {statement.isSuccess ? (
            <Alert tone="success">
              Statement emailed ({statement.data.count} transactions).
            </Alert>
          ) : null}
          <Button
            variant="secondary"
            className="h-12 rounded-2xl"
            type="button"
            loading={statement.isPending}
            disabled={!start || !end}
            onClick={() => statement.mutate()}
          >
            Email Statement
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-5">
            <Input
              aria-label="Search transactions"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              className="text-sm font-semibold text-primary"
              onClick={() => setMode('filter')}
            >
              Filter by date
            </button>
          </div>
          {transactions.isLoading ? (
            <p className="text-center text-muted">Loading history…</p>
          ) : transactions.isError ? (
            <ErrorState
              message={transactions.error.message}
              retry={() => void transactions.refetch()}
            />
          ) : filtered.length ? (
            <ul className="divide-y">
              {filtered.map((tx) => (
                <li key={tx.id}>
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-4 py-5 text-left"
                    onClick={() => onOpenReceipt(tx)}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-base font-medium text-muted">
                        {transactionTitle(tx)}
                      </span>
                      <span className="mt-1 block text-xs text-muted">
                        {formatHistoryWhen(tx.createdAt)}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-base font-bold">
                        {money(tx.amount).replace('₦', '').trim()}
                      </span>
                      <span
                        className={`mt-1 block text-xs font-medium capitalize ${statusTone(tx.status)}`}
                      >
                        {tx.status.toLowerCase()}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No transaction records found"
              description="Funding, transfers and purchases will appear here."
            />
          )}
        </>
      )}
    </div>
  );
}