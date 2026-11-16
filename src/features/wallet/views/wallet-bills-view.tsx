import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { walletApi, type WalletOverview } from '../api';
import { WalletFlowHeader } from '../components/wallet-flow-header';
import { WalletPickerSheet } from '../components/wallet-picker-sheet';
import { WalletPaymentFlow } from '../wallet-payment-flow';
import { Alert, FormField, Input } from '../../../components/ui';
import { ChevronDown } from 'lucide-react';
import { WalletPayBar } from '../components/wallet-pay-bar';

function inferBillPath(categoryName: string, billerName: string) {
  const hay = `${categoryName} ${billerName}`.toLowerCase();
  if (hay.includes('cable') || hay.includes('dstv') || hay.includes('gotv'))
    return 'cable-tv' as const;
  return 'electricity' as const;
}

export function WalletBillsView({
  token,
  wallet,
  onSuccess,
}: {
  token: string;
  wallet: WalletOverview;
  onSuccess: () => void;
}) {
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [billerId, setBillerId] = useState('');
  const [billerName, setBillerName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [picker, setPicker] = useState<'category' | 'biller' | null>(null);
  const [started, setStarted] = useState(false);
  const [validationReference, setValidationReference] = useState('');

  const categories = useQuery({
    queryKey: ['vas-categories'],
    queryFn: () => walletApi.categories(token),
    enabled: Boolean(token),
  });
  const billers = useQuery({
    queryKey: ['vas-billers', categoryId],
    queryFn: () => walletApi.billers(token, categoryId),
    enabled: Boolean(token && categoryId),
  });

  const billPath = useMemo(
    () => inferBillPath(categoryName, billerName),
    [billerName, categoryName],
  );

  const validate = useMutation({
    mutationFn: () =>
      walletApi.validateBiller(token, {
        billerId,
        beneficiaryIdentifier: accountNumber,
        fields: { accountNumber },
      }),
    onSuccess: (value) => {
      setValidationReference(value.validationReference);
      setStarted(true);
    },
  });

  if (started && billerId && validationReference) {
    return (
      <WalletPaymentFlow
        kind={billPath}
        token={token}
        wallet={wallet}
        onSuccess={onSuccess}
        preset={{
          billerId,
          billerName,
          beneficiaryIdentifier: accountNumber,
          amount,
          validationReference,
        }}
      />
    );
  }

  return (
    <div>
      <WalletFlowHeader
        title="Bill Payment"
        showHistory
        historyHref="/app/wallet?action=history"
      />
      <form
        className="grid gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (billerId && accountNumber && amount) validate.mutate();
        }}
      >
        {categories.isError ? (
          <Alert tone="danger">Could not load bill categories.</Alert>
        ) : null}
        {validate.isError ? (
          <Alert tone="danger">{validate.error.message}</Alert>
        ) : null}
        <FormField label="Bill Type">
          <button
            type="button"
            className="flex h-12 w-full items-center justify-between rounded-xl border bg-surface px-4 text-left"
            onClick={() => setPicker('category')}
          >
            <span className={categoryName ? 'font-medium' : 'text-muted'}>
              {categoryName || 'Select'}
            </span>
            <ChevronDown size={18} className="text-muted" />
          </button>
        </FormField>
        <FormField label="Select Provider">
          <button
            type="button"
            disabled={!categoryId}
            className="flex h-12 w-full items-center justify-between rounded-xl border bg-surface px-4 text-left disabled:opacity-50"
            onClick={() => setPicker('biller')}
          >
            <span className={billerName ? 'font-medium' : 'text-muted'}>
              {billerName || 'Select'}
            </span>
            <ChevronDown size={18} className="text-muted" />
          </button>
        </FormField>
        <FormField
          label={
            billPath === 'electricity'
              ? 'Account Number'
              : 'Smart Card Number'
          }
        >
          <Input
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder={
              billPath === 'electricity'
                ? 'enter account number'
                : 'enter smart card number'
            }
          />
        </FormField>
        <FormField label="Amount">
          <Input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter Amount in Figure"
          />
        </FormField>
        <WalletPayBar
          type="submit"
          label="Pay"
          loading={validate.isPending}
          disabled={!categoryId || !billerId || !accountNumber || !amount}
        />
      </form>

      <WalletPickerSheet
        open={picker === 'category'}
        title="Bill Type"
        items={(categories.data ?? []).map((c) => ({
          id: c.id,
          label: c.name,
        }))}
        selectedId={categoryId}
        onSelect={(id) => {
          const item = categories.data?.find((c) => c.id === id);
          setCategoryId(id);
          setCategoryName(item?.name ?? '');
          setBillerId('');
          setBillerName('');
        }}
        onClose={() => setPicker(null)}
      />
      <WalletPickerSheet
        open={picker === 'biller'}
        title="Select Provider"
        items={(billers.data ?? []).map((b) => ({
          id: b.id,
          label: b.name,
        }))}
        selectedId={billerId}
        onSelect={(id) => {
          const item = billers.data?.find((b) => b.id === id);
          setBillerId(id);
          setBillerName(item?.name ?? '');
        }}
        onClose={() => setPicker(null)}
      />
    </div>
  );
}