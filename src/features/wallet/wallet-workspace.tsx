import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownLeft,
  Cable,
  Copy,
  Eye,
  EyeOff,
  Phone,
  RadioTower,
  ReceiptText,
  Send,
  Share2,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../contexts/auth-context';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Dialog,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  Select,
  Tabs,
} from '../../components/ui';
import { walletApi, type WalletTransaction } from './api';

type Action =
  'transfer' | 'airtime' | 'data' | 'electricity' | 'cable-tv' | null;
const actionItems = [
  { id: 'transfer', label: 'Transfer', icon: Send },
  { id: 'airtime', label: 'Airtime', icon: Phone },
  { id: 'data', label: 'Data', icon: RadioTower },
  { id: 'electricity', label: 'Electricity', icon: Zap },
  { id: 'cable-tv', label: 'Cable TV', icon: Cable },
] as const;

function money(value: string | number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(Number(value));
}
function label(value: string) {
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());
}

export function WalletWorkspace() {
  const { session } = useAuth();
  const token = session?.accessToken ?? '';
  const client = useQueryClient();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState<Action>(null);
  const [selected, setSelected] = useState<WalletTransaction | null>(null);
  const overview = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletApi.overview(token),
    enabled: Boolean(token),
  });
  const transactions = useQuery({
    queryKey: ['wallet-transactions', search],
    queryFn: () => walletApi.transactions(token, search),
    enabled: Boolean(token),
  });
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['wallet'] });
    void client.invalidateQueries({ queryKey: ['wallet-transactions'] });
  };
  if (overview.isLoading)
    return (
      <Card>
        <p>Loading your wallet…</p>
      </Card>
    );
  if (overview.isError)
    return (
      <ErrorState
        message={overview.error.message}
        retry={() => void overview.refetch()}
      />
    );
  const wallet = overview.data;
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
      <div className="grid gap-6">
        <Card className="overflow-hidden border-0 bg-primary p-0 text-white shadow-xl">
          <div className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-white/70">
              PEPSA wallet
            </p>
            <div className="mt-3 flex items-center gap-3">
              <p className="text-4xl font-bold">
                {balanceVisible
                  ? money(wallet?.availableBalance ?? 0)
                  : '••••••••'}
              </p>
              <button
                aria-label={balanceVisible ? 'Hide balance' : 'Show balance'}
                onClick={() => setBalanceVisible(!balanceVisible)}
              >
                {balanceVisible ? <EyeOff /> : <Eye />}
              </button>
            </div>
            <p className="mt-2 text-sm text-white/70">
              {wallet?.status === 'ACTIVE'
                ? 'Available balance'
                : `Wallet status: ${wallet?.status}`}
            </p>
          </div>
          <div className="grid gap-4 bg-black/15 p-6 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-white/60">Funding account</p>
              <p className="mt-1 font-semibold">
                {wallet?.fundingAccount?.accountName ??
                  'Provisioning in progress'}
              </p>
              <p>{wallet?.fundingAccount?.bankName}</p>
            </div>
            {wallet?.fundingAccount ? (
              <div className="sm:text-right">
                <p className="text-xs uppercase text-white/60">
                  Account number
                </p>
                <button
                  className="mt-1 inline-flex items-center gap-2 text-xl font-bold"
                  onClick={() =>
                    void navigator.clipboard.writeText(
                      wallet.fundingAccount!.accountNumber,
                    )
                  }
                >
                  {wallet.fundingAccount.accountNumber}
                  <Copy size={17} />
                </button>
              </div>
            ) : null}
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {actionItems.map(({ id, label: text, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setAction(id)}
              className="rounded-2xl border bg-surface p-4 text-left transition hover:border-primary hover:bg-primary-soft"
            >
              <Icon className="text-primary" />
              <span className="mt-3 block text-sm font-semibold">{text}</span>
            </button>
          ))}
        </div>
        <Card>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Transactions</h2>
              <p className="text-sm text-muted">Immutable wallet activity</p>
            </div>
            <Input
              aria-label="Search transactions"
              placeholder="Search name or reference"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>
          {transactions.isLoading ? (
            <p>Loading transactions…</p>
          ) : transactions.isError ? (
            <ErrorState
              message={transactions.error.message}
              retry={() => void transactions.refetch()}
            />
          ) : transactions.data?.items.length ? (
            <div className="divide-y">
              {transactions.data.items.map((tx) => (
                <button
                  key={tx.id}
                  className="flex w-full items-center justify-between gap-4 py-4 text-left"
                  onClick={() => setSelected(tx)}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                      <ArrowDownLeft />
                    </span>
                    <span className="min-w-0">
                      <strong className="block truncate">
                        {tx.counterpartyName ?? label(tx.type)}
                      </strong>
                      <small className="text-muted">
                        {new Date(tx.createdAt).toLocaleString()} ·{' '}
                        {label(tx.status)}
                      </small>
                    </span>
                  </div>
                  <strong>{money(tx.amount)}</strong>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No transactions"
              description="Funding, transfers and purchases will appear here."
            />
          )}
        </Card>
      </div>
      <Card className="h-fit">
        <ReceiptText className="text-primary" />
        <h2 className="mt-4 text-xl font-semibold">Fund your wallet</h2>
        <p className="mt-2 text-sm text-muted">
          Transfer money from any Nigerian bank to your PEPSA virtual account.
          Credits are confirmed by the server and appear in your history.
        </p>
        {wallet?.fundingAccount ? (
          <dl className="mt-5 grid gap-3 rounded-2xl bg-surface-muted p-4 text-sm">
            <div>
              <dt className="text-muted">Account name</dt>
              <dd className="font-semibold">
                {wallet.fundingAccount.accountName}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Bank</dt>
              <dd className="font-semibold">
                {wallet.fundingAccount.bankName}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Account number</dt>
              <dd className="font-semibold">
                {wallet.fundingAccount.accountNumber}
              </dd>
            </div>
          </dl>
        ) : (
          <Alert>
            Funding details will appear after wallet provisioning completes.
          </Alert>
        )}
      </Card>
      <PaymentDialog
        action={action}
        onClose={() => setAction(null)}
        token={token}
        walletHasNin={Boolean(wallet?.hasNin)}
        onSuccess={refresh}
      />
      <ReceiptDialog transaction={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function PaymentDialog({
  action,
  onClose,
  token,
  walletHasNin,
  onSuccess,
}: {
  action: Action;
  onClose: () => void;
  token: string;
  walletHasNin: boolean;
  onSuccess: () => void;
}) {
  const [scope, setScope] = useState('internal');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [bankName, setBankName] = useState('PEPSA');
  const [accountName, setAccountName] = useState('');
  const [phone, setPhone] = useState('');
  const [provider, setProvider] = useState('');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [nin, setNin] = useState('');
  const [save, setSave] = useState(false);
  const [error, setError] = useState('');
  const [productId, setProductId] = useState('');
  const [validationReference, setValidationReference] = useState('');
  const abort = useRef<AbortController | null>(null);
  const network = useQuery({
    queryKey: ['network', phone],
    queryFn: ({ signal }) => walletApi.detectNetwork(token, phone, signal),
    enabled: Boolean(
      action && ['airtime', 'data'].includes(action) && /^0\d{10}$/.test(phone),
    ),
    retry: false,
  });
  const beneficiaries = useQuery({
    queryKey: ['wallet-beneficiaries'],
    queryFn: () => walletApi.beneficiaries(token),
    enabled: action === 'transfer',
  });
  const plans = useQuery({
    queryKey: ['vas-plans', phone],
    queryFn: () => walletApi.plans(token, phone),
    enabled: action === 'data' && /^0\d{10}$/.test(phone),
  });
  const detectedProvider = provider || network.data?.network || '';
  useEffect(() => {
    if (
      action !== 'transfer' ||
      accountNumber.length !== 10 ||
      (scope === 'external' && !bankCode)
    )
      return;
    const timer = window.setTimeout(() => {
      abort.current?.abort();
      abort.current = new AbortController();
      walletApi
        .resolve(
          token,
          {
            scope,
            accountNumber,
            bankCode: scope === 'external' ? bankCode : undefined,
          },
          abort.current.signal,
        )
        .then((r) => {
          setAccountName(r.accountName);
          setBankName(r.bankName);
        })
        .catch(() => setAccountName(''));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [accountNumber, bankCode, scope, action, token]);
  const validateBill = useMutation({
    mutationFn: () =>
      walletApi.validateBiller(token, {
        billerId: bankCode || provider,
        beneficiaryIdentifier: accountNumber,
        fields: { accountNumber },
      }),
    onSuccess: (value) => {
      setValidationReference(value.validationReference);
      setAccountName(value.customerName);
    },
    onError: (e) => setError(e.message),
  });
  const mutation = useMutation({
    mutationFn: async () => {
      setError('');
      const key = crypto.randomUUID();
      if (action === 'transfer') {
        if (scope === 'external' && !walletHasNin) {
          await walletApi.saveNin(token, nin);
        }
        return walletApi.transfer(
          token,
          scope as 'internal' | 'external',
          {
            accountNumber,
            bankCode: scope === 'external' ? bankCode : undefined,
            bankName,
            accountName,
            amount: Number(amount),
            pin,
            saveBeneficiary: save,
          },
          key,
        );
      }
      const beneficiaryIdentifier = phone || accountNumber;
      const path = action ?? '';
      return walletApi.purchase(
        token,
        path,
        {
          productProvider: detectedProvider || bankName,
          beneficiaryIdentifier,
          amount: Number(amount),
          pin,
          ...(action === 'data' ? { productId } : {}),
          ...(['electricity', 'cable-tv'].includes(path)
            ? {
                billerId: bankCode || provider,
                validationReference,
                customerFields: { accountNumber },
              }
            : {}),
        },
        key,
      );
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (e) => setError(e.message),
  });
  if (!action) return null;
  const isTransfer = action === 'transfer';
  const isBill = ['electricity', 'cable-tv'].includes(action);
  return (
    <Dialog
      open
      title={actionItems.find((x) => x.id === action)?.label ?? 'Payment'}
      onClose={onClose}
    >
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        {isTransfer ? (
          <Tabs
            value={scope}
            onChange={(value) => {
              setScope(value);
              setAccountName('');
            }}
            items={[
              { value: 'internal', label: 'To PEPSA' },
              { value: 'external', label: 'Other bank' },
            ]}
          />
        ) : null}
        {isTransfer && beneficiaries.data?.length ? (
          <div>
            <p className="mb-2 text-sm font-medium">Beneficiaries</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {beneficiaries.data
                .filter((item) => item.scope === scope)
                .map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className="shrink-0 rounded-xl border px-3 py-2 text-left text-sm hover:border-primary"
                    onClick={() => {
                      setAccountNumber(item.accountNumber);
                      setBankCode(item.bankCode ?? '');
                      setBankName(item.bankName);
                      setAccountName(item.accountName);
                    }}
                  >
                    <strong className="block">{item.accountName}</strong>
                    <span className="text-xs text-muted">
                      {item.bankName} · {item.accountNumber.slice(-4)}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        ) : null}
        {isTransfer && scope === 'external' ? (
          <FormField label="Bank code">
            <Input
              required
              value={bankCode}
              onChange={(e) => {
                setBankCode(e.target.value);
                setAccountName('');
              }}
              placeholder="Bank code"
            />
          </FormField>
        ) : null}
        {isTransfer ? (
          <FormField label="Recipient account">
            <Input
              required
              inputMode="numeric"
              maxLength={10}
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value.replace(/\D/g, ''));
                setAccountName('');
              }}
              placeholder="10 digit account number"
            />
            {accountName ? (
              <span className="text-sm font-semibold text-success">
                {accountName}
              </span>
            ) : null}
          </FormField>
        ) : null}
        {!isTransfer && !isBill ? (
          <FormField label="Phone number">
            <Input
              required
              inputMode="tel"
              maxLength={11}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            />
            {network.isFetching ? (
              <small>Detecting network…</small>
            ) : detectedProvider ? (
              <small className="text-success">
                {detectedProvider.toUpperCase()}
              </small>
            ) : null}
          </FormField>
        ) : null}
        {action === 'data' ? (
          <FormField label="Data plan">
            <Select
              required
              value={productId}
              onChange={(e) => {
                const plan = plans.data?.find(
                  (item) => item.productId === e.target.value,
                );
                setProductId(e.target.value);
                if (plan) setAmount(String(plan.amount));
              }}
            >
              <option value="">Select plan</option>
              {plans.data?.map((plan) => (
                <option key={plan.productId} value={plan.productId}>
                  {plan.name} · {money(plan.amount)}
                </option>
              ))}
            </Select>
          </FormField>
        ) : null}
        {isBill ? (
          <>
            <FormField
              label={
                action === 'electricity'
                  ? 'Electricity provider'
                  : 'Cable provider'
              }
            >
              <Input
                required
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value);
                  setValidationReference('');
                }}
              />
            </FormField>
            <FormField
              label={
                action === 'electricity' ? 'Meter number' : 'Smartcard number'
              }
            >
              <Input
                required
                value={accountNumber}
                onChange={(e) => {
                  setAccountNumber(e.target.value);
                  setValidationReference('');
                }}
              />
              {accountName ? (
                <small className="text-success">{accountName}</small>
              ) : null}
            </FormField>
            <Button
              type="button"
              variant="secondary"
              loading={validateBill.isPending}
              onClick={() => validateBill.mutate()}
            >
              Validate customer
            </Button>
          </>
        ) : null}
        <FormField label="Amount">
          <Input
            required
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </FormField>
        {isTransfer && scope === 'external' && !walletHasNin ? (
          <FormField
            label="National Identification Number"
            hint="Encrypted and stored securely; it will not be shown again."
          >
            <Input
              required
              type="password"
              inputMode="numeric"
              maxLength={11}
              value={nin}
              onChange={(e) => setNin(e.target.value.replace(/\D/g, ''))}
            />
          </FormField>
        ) : null}
        <FormField label="Transaction PIN">
          <Input
            required
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          />
        </FormField>
        {isTransfer ? (
          <label className="flex items-center gap-3 text-sm">
            <Checkbox
              checked={save}
              onChange={(e) => setSave(e.target.checked)}
            />
            Save beneficiary
          </label>
        ) : null}
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Button
          type="submit"
          loading={mutation.isPending}
          disabled={
            !amount ||
            pin.length !== 4 ||
            (isTransfer && !accountName) ||
            (action === 'data' && !productId) ||
            (isBill && !validationReference)
          }
        >
          Confirm payment
        </Button>
      </form>
    </Dialog>
  );
}

function ReceiptDialog({
  transaction,
  onClose,
}: {
  transaction: WalletTransaction | null;
  onClose: () => void;
}) {
  const printable = useMemo(
    () =>
      transaction
        ? `<html><body style="font-family:Arial;padding:40px"><h1>PEPSA receipt</h1><h2>${label(transaction.type)}</h2><p style="font-size:32px">${money(transaction.amount)}</p><hr/><p>Reference: ${transaction.reference}</p><p>Status: ${label(transaction.status)}</p><p>Date: ${new Date(transaction.createdAt).toLocaleString()}</p><p>Recipient: ${transaction.counterpartyName ?? '-'}</p></body></html>`
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
            <p className="mt-2 text-3xl font-bold">
              {money(transaction.amount)}
            </p>
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
                  title: 'PEPSA receipt',
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
