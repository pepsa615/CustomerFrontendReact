import { useMemo } from 'react';
import { ReceiptText, Share2 } from 'lucide-react';
import { Dialog, Button } from '../../components/ui';
import type { WalletTransaction } from './api';
import { label, money } from './wallet-format';

export function WalletReceiptDialog({
  transaction,
  onClose,
}: {
  transaction: WalletTransaction | null;
  onClose: () => void;
}) {
  const printable = useMemo(
    () =>
      transaction
        ? `<html><body style="font-family:Arial;padding:40px"><h1>Receipt</h1><h2>${label(transaction.type)}</h2><p style="font-size:32px">${money(transaction.amount)}</p><hr/><p>Reference: ${transaction.reference}</p><p>Status: ${label(transaction.status)}</p><p>Date: ${new Date(transaction.createdAt).toLocaleString()}</p><p>Recipient: ${transaction.counterpartyName ?? '-'}</p></body></html>`
        : '',
    [transaction],
  );
  return (
    <Dialog
      open={Boolean(transaction)}
      title="Transaction receipt"
      onClose={onClose}
    >
      {transaction ? (
        <div className="grid gap-4">
          <div className="rounded-2xl bg-primary-soft p-5 text-center">
            <p className="text-sm text-muted">{label(transaction.type)}</p>
            <p className="mt-2 text-3xl font-bold">{money(transaction.amount)}</p>
            <p className="mt-2 text-sm font-semibold text-success">
              {label(transaction.status)}
            </p>
          </div>
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-muted">Reference</dt>
              <dd className="break-all font-medium">{transaction.reference}</dd>
            </div>
            <div>
              <dt className="text-muted">Recipient</dt>
              <dd>{transaction.counterpartyName ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-muted">Date</dt>
              <dd>{new Date(transaction.createdAt).toLocaleString()}</dd>
            </div>
          </dl>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                const w = window.open();
                w?.document.write(printable);
                w?.document.close();
                w?.print();
              }}
            >
              <ReceiptText size={18} />
              PDF
            </Button>
            <Button
              onClick={() =>
                void navigator.share?.({
                  title: 'Receipt',
                  text: `${transaction.reference} · ${money(transaction.amount)}`,
                })
              }
            >
              <Share2 size={18} />
              Share
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}