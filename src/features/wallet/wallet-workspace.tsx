import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-context';
import { Card, ErrorState } from '../../components/ui';
import { walletApi, type WalletTransaction } from './api';
import { parseWalletAction, paymentKindFromAction } from './wallet-types';
import { WalletDepositView } from './views/wallet-deposit-view';
import { WalletHistoryView } from './views/wallet-history-view';
import { WalletHomeView } from './views/wallet-home-view';
import { WalletBillsView } from './views/wallet-bills-view';
import { WalletPaymentFlow } from './wallet-payment-flow';
import { WalletReceiptDialog } from './wallet-receipt-dialog';

export function WalletWorkspace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const action = parseWalletAction(searchParams.get('action'));
  const paymentKind = action ? paymentKindFromAction(action) : null;

  const { session } = useAuth();
  const token = session?.accessToken ?? '';
  const client = useQueryClient();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [selected, setSelected] = useState<WalletTransaction | null>(null);

  const overview = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletApi.overview(token),
    enabled: Boolean(token),
  });
  const transactions = useQuery({
    queryKey: ['wallet-transactions'],
    queryFn: () => walletApi.transactions(token),
    enabled: Boolean(token),
  });

  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['wallet'] });
    void client.invalidateQueries({ queryKey: ['wallet-transactions'] });
  };

  const onPaymentSuccess = () => {
    refresh();
    navigate('/app/wallet?action=history', { replace: true });
  };

  if (overview.isLoading) {
    return (
      <Card>
        <p>Loading your wallet…</p>
      </Card>
    );
  }
  if (overview.isError || !overview.data) {
    return (
      <ErrorState
        message={overview.error?.message ?? 'Could not load wallet'}
        retry={() => void overview.refetch()}
      />
    );
  }

  const wallet = overview.data;

  if (action === 'deposit') {
    return (
      <>
        <WalletDepositView wallet={wallet} />
        <WalletReceiptDialog
          transaction={selected}
          onClose={() => setSelected(null)}
        />
      </>
    );
  }

  if (action === 'history') {
    return (
      <>
        <WalletHistoryView
          token={token}
          onOpenReceipt={(tx) => setSelected(tx)}
        />
        <WalletReceiptDialog
          transaction={selected}
          onClose={() => setSelected(null)}
        />
      </>
    );
  }

  if (action === 'bills') {
    return (
      <>
        <WalletBillsView
          token={token}
          wallet={wallet}
          onSuccess={onPaymentSuccess}
        />
        <WalletReceiptDialog
          transaction={selected}
          onClose={() => setSelected(null)}
        />
      </>
    );
  }

  if (paymentKind) {
    return (
      <>
        <WalletPaymentFlow
          kind={paymentKind}
          token={token}
          wallet={wallet}
          onSuccess={onPaymentSuccess}
        />
        <WalletReceiptDialog
          transaction={selected}
          onClose={() => setSelected(null)}
        />
      </>
    );
  }

  const preview = (transactions.data?.items ?? []).slice(0, 6);

  return (
    <>
      <WalletHomeView
        wallet={wallet}
        balanceVisible={balanceVisible}
        onToggleBalance={() => setBalanceVisible((v) => !v)}
        preview={preview}
        onOpenReceipt={(tx) => setSelected(tx)}
      />
      <WalletReceiptDialog
        transaction={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}