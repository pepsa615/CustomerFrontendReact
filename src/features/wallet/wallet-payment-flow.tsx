import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronDown, UserRound } from 'lucide-react';
import { walletApi, type WalletOverview } from './api';
import type { PaymentKind } from './wallet-types';
import { money } from './wallet-format';
import { useTransactionGate } from './use-transaction-gate';
import { WalletFlowHeader } from './components/wallet-flow-header';
import { WalletPickerSheet } from './components/wallet-picker-sheet';
import { WalletPayBar } from './components/wallet-pay-bar';
import {
  Alert,
  Button,
  Checkbox,
  FormField,
  Input,
  Tabs,
} from '../../components/ui';

type Preset = {
  billerId?: string;
  billerName?: string;
  beneficiaryIdentifier?: string;
  amount?: string;
  validationReference?: string;
};

const titles: Record<PaymentKind, string> = {
  transfer: 'Transfer',
  airtime: 'Mobile Top-Up',
  data: 'Mobile Top-Up',
  electricity: 'Bill Payment',
  'cable-tv': 'Bill Payment',
};

export function WalletPaymentFlow({
  kind,
  token,
  wallet,
  onSuccess,
  preset,
}: {
  kind: PaymentKind;
  token: string;
  wallet: WalletOverview;
  onSuccess: () => void;
  preset?: Preset;
}) {
  useTransactionGate(token, true);
  const client = useQueryClient();
  const [step, setStep] = useState<'form' | 'review'>(
    preset?.validationReference ? 'review' : 'form',
  );
  const [scope, setScope] = useState<'internal' | 'external'>('internal');
  const [accountNumber, setAccountNumber] = useState(
    preset?.beneficiaryIdentifier ?? '',
  );
  const [bankCode, setBankCode] = useState(preset?.billerId ?? '');
  const [bankName, setBankName] = useState(preset?.billerName ?? 'Pepsa');
  const [accountName, setAccountName] = useState('');
  const [phone, setPhone] = useState(preset?.beneficiaryIdentifier ?? '');
  const [provider, setProvider] = useState(preset?.billerId ?? '');
  const [providerName, setProviderName] = useState(preset?.billerName ?? '');
  const [amount, setAmount] = useState(preset?.amount ?? '');
  const [pin, setPin] = useState('');
  const [nin, setNin] = useState('');
  const [save, setSave] = useState(false);
  const [error, setError] = useState('');
  const [productId, setProductId] = useState('');
  const [validationReference, setValidationReference] = useState(
    preset?.validationReference ?? '',
  );
  const [topUpType, setTopUpType] = useState<'airtime' | 'data'>(
    kind === 'data' ? 'data' : 'airtime',
  );
  const [bankPicker, setBankPicker] = useState(false);
  const [providerPicker, setProviderPicker] = useState(false);
  const [airtimeBeneficiaryPicker, setAirtimeBeneficiaryPicker] =
    useState(false);
  const [usePoints, setUsePoints] = useState(false);
  const abort = useRef<AbortController | null>(null);

  const effectiveKind: PaymentKind =
    kind === 'airtime' || kind === 'data' ? topUpType : kind;

  const beneficiaries = useQuery({
    queryKey: ['wallet-beneficiaries'],
    queryFn: () => walletApi.beneficiaries(token),
    enabled: kind === 'transfer' || kind === 'airtime' || kind === 'data',
  });
  const loyalty = useQuery({
    queryKey: ['wallet-loyalty'],
    queryFn: () => walletApi.loyalty(token),
    enabled: Boolean(token) && (kind === 'airtime' || kind === 'data'),
  });
  const banks = useQuery({
    queryKey: ['wallet-banks'],
    queryFn: () => walletApi.banks(token),
    enabled: kind === 'transfer' && scope === 'external',
  });
  const network = useQuery({
    queryKey: ['network', phone],
    queryFn: ({ signal }) => walletApi.detectNetwork(token, phone, signal),
    enabled:
      (effectiveKind === 'airtime' || effectiveKind === 'data') &&
      /^0\d{10}$/.test(phone),
    retry: false,
  });
  const plans = useQuery({
    queryKey: ['vas-plans', phone],
    queryFn: () => walletApi.plans(token, phone),
    enabled: effectiveKind === 'data' && /^0\d{10}$/.test(phone),
  });
  const billers = useQuery({
    queryKey: ['vas-billers-electricity'],
    queryFn: async () => {
      const categories = await walletApi.categories(token);
      const electricity =
        categories.find((c) => c.name.toLowerCase().includes('electric')) ??
        categories[0];
      if (!electricity) return [];
      return walletApi.billers(token, electricity.id);
    },
    enabled:
      Boolean(token) &&
      (effectiveKind === 'electricity' || effectiveKind === 'cable-tv') &&
      !preset?.billerId,
  });

  const detectedProvider = providerName || network.data?.network || '';

  useEffect(() => {
    if (
      kind !== 'transfer' ||
      accountNumber.length !== 10 ||
      (scope === 'external' && !bankCode)
    ) {
      return;
    }
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
  }, [accountNumber, bankCode, kind, scope, token]);

  const validateBill = useMutation({
    mutationFn: () =>
      walletApi.validateBiller(token, {
        billerId: provider || bankCode,
        beneficiaryIdentifier: accountNumber,
        fields: { accountNumber },
      }),
    onSuccess: (value) => {
      setValidationReference(value.validationReference);
      setAccountName(value.customerName);
      setStep('review');
    },
    onError: (e) => setError(e.message),
  });

  const pay = useMutation({
    mutationFn: async () => {
      setError('');
      const key = crypto.randomUUID();
      if (kind === 'transfer') {
        if (scope === 'external' && !wallet.hasNin) {
          await walletApi.saveNin(token, nin);
        }
        return walletApi.transfer(
          token,
          scope,
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
      const beneficiaryIdentifier =
        effectiveKind === 'airtime' || effectiveKind === 'data'
          ? phone
          : accountNumber;
      const path = effectiveKind;
      return walletApi.purchase(
        token,
        path,
        {
          productProvider: detectedProvider || bankName,
          beneficiaryIdentifier,
          amount: Number(amount),
          pin,
          saveBeneficiary: save,
          ...(effectiveKind === 'data' ? { productId } : {}),
          ...(['electricity', 'cable-tv'].includes(path)
            ? {
                billerId: provider || bankCode,
                validationReference,
                customerFields: { accountNumber },
              }
            : {}),
        },
        key,
      );
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['wallet'] });
      void client.invalidateQueries({ queryKey: ['wallet-transactions'] });
      onSuccess();
    },
    onError: (e) => setError(e.message),
  });

  const bankItems = useMemo(
    () =>
      (banks.data ?? [])
        .map((bank) => ({
          id: bank.attributes?.nipCode ?? bank.code ?? bank.id ?? '',
          label: bank.attributes?.name ?? bank.name ?? '',
        }))
        .filter((b) => b.id && b.label)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [banks.data],
  );

  const canContinue = () => {
    if (kind === 'transfer') {
      return (
        accountNumber.length === 10 &&
        Boolean(accountName) &&
        Number(amount) > 0 &&
        (scope === 'internal' || Boolean(bankCode))
      );
    }
    if (effectiveKind === 'airtime') {
      return /^0\d{10}$/.test(phone) && Number(amount) > 0;
    }
    if (effectiveKind === 'data') {
      return (
        /^0\d{10}$/.test(phone) && Boolean(productId) && Number(amount) > 0
      );
    }
    if (['electricity', 'cable-tv'].includes(effectiveKind)) {
      return (
        Boolean(provider || bankCode) && accountNumber && Number(amount) > 0
      );
    }
    return false;
  };

  const goReview = () => {
    setError('');
    if (['electricity', 'cable-tv'].includes(effectiveKind)) {
      if (validationReference) {
        setStep('review');
        return;
      }
      validateBill.mutate();
      return;
    }
    if (!canContinue()) {
      setError('Complete all required fields to continue.');
      return;
    }
    setStep('review');
  };

  const pointsDiscount =
    loyalty.data?.enabled && usePoints ? loyalty.data.discountNaira : 0;
  const payable = Math.max(0, Number(amount) - pointsDiscount);

  if (step === 'review') {
    const reviewTitle =
      effectiveKind === 'airtime' || effectiveKind === 'data'
        ? 'Airtime'
        : effectiveKind === 'transfer'
          ? 'Transfer'
          : 'BILLS';
    return (
      <div>
        <WalletFlowHeader title={reviewTitle} />
        <p className="text-center text-3xl font-bold">{money(payable)}</p>
        <dl className="mt-8 divide-y text-sm">
          <Row label="Product name" value={effectiveKind.replace('-', ' ')} />
          {effectiveKind === 'transfer' ? (
            <>
              <Row label="Recipient" value={accountName} />
              <Row label="Account number" value={accountNumber} />
              <Row label="Bank" value={bankName} />
            </>
          ) : null}
          {(effectiveKind === 'airtime' || effectiveKind === 'data') && (
            <>
              <Row
                label="Network operator"
                value={detectedProvider.toUpperCase() || '—'}
              />
              <Row label="Recipient mobile" value={phone} />
            </>
          )}
          {['electricity', 'cable-tv'].includes(effectiveKind) && (
            <>
              <Row label="Network operator" value={providerName || '—'} />
              <Row label="Account number" value={accountNumber} />
            </>
          )}
          <Row label="Amount" value={money(amount)} />
          {loyalty.data?.enabled && effectiveKind === 'airtime' ? (
            <label className="flex items-center justify-between gap-4 py-3">
              <span className="text-muted">
                {loyalty.data.label} ({loyalty.data.points})
              </span>
              <span className="flex items-center gap-2 font-medium">
                {money(loyalty.data.discountNaira)}
                <Checkbox
                  checked={usePoints}
                  onChange={(e) => setUsePoints(e.target.checked)}
                />
              </span>
            </label>
          ) : null}
          {pointsDiscount > 0 ? (
            <Row label="Total" value={money(payable)} />
          ) : null}
        </dl>
        <p className="mt-8 text-base font-bold">Payment Sources</p>
        <div className="mt-3 rounded-2xl border p-4">
          <p className="font-bold">Account Balance</p>
          <p className="text-sm text-muted">{money(wallet.availableBalance)}</p>
        </div>
        <div className="mt-6">
          <FormField label="Transaction PIN">
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 4 digit pin"
              className="text-center"
            />
          </FormField>
        </div>
        {kind === 'transfer' ? (
          <label className="mt-4 flex items-center justify-between gap-3 text-sm">
            <span className="font-medium">Save as Beneficiary</span>
            <Checkbox
              checked={save}
              onChange={(e) => setSave(e.target.checked)}
            />
          </label>
        ) : (
          <label className="mt-4 flex items-center justify-between gap-3 text-sm">
            <span className="font-medium">Save as Beneficiary</span>
            <Checkbox
              checked={save}
              onChange={(e) => setSave(e.target.checked)}
            />
          </label>
        )}
        {error ? (
          <div className="mt-4">
            <Alert tone="danger">{error}</Alert>
          </div>
        ) : null}
        <WalletPayBar
          label="Pay"
          loading={pay.isPending}
          disabled={pin.length !== 4}
          onClick={() => pay.mutate()}
        />
        <Button
          variant="ghost"
          className="mt-3 w-full"
          type="button"
          onClick={() => setStep('form')}
        >
          Edit details
        </Button>
      </div>
    );
  }

  return (
    <div>
      <WalletFlowHeader
        title={titles[kind]}
        showHistory={kind !== 'transfer'}
        historyHref="/app/wallet?action=history"
      />
      <form
        className="grid gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          goReview();
        }}
      >
        {kind === 'transfer' ? (
          <>
            <Tabs
              value={scope}
              onChange={(value) => {
                setScope(value as 'internal' | 'external');
                setAccountName('');
              }}
              items={[
                { value: 'internal', label: 'Pepsa' },
                { value: 'external', label: 'Other Banks' },
              ]}
            />
            {beneficiaries.data?.length ? (
              <BeneficiaryList
                scope={scope}
                items={beneficiaries.data}
                onPick={(item) => {
                  setAccountNumber(item.accountNumber);
                  setBankCode(item.bankCode ?? '');
                  setBankName(item.bankName);
                  setAccountName(item.accountName);
                }}
              />
            ) : null}
            {scope === 'external' ? (
              <FormField label="Bank">
                <button
                  type="button"
                  className="flex h-12 w-full items-center justify-between rounded-xl border px-4"
                  onClick={() => setBankPicker(true)}
                >
                  <span className={bankName ? 'font-medium' : 'text-muted'}>
                    {bankName || 'Select Bank'}
                  </span>
                  <ChevronDown size={18} className="text-muted" />
                </button>
              </FormField>
            ) : null}
            <FormField label="Account number">
              <Input
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
          </>
        ) : null}

        {(kind === 'airtime' || kind === 'data') && (
          <>
            <FormField label="Top-Up Type">
              <button
                type="button"
                className="flex h-12 w-full items-center justify-between rounded-xl border px-4"
                onClick={() =>
                  setTopUpType((t) => (t === 'airtime' ? 'data' : 'airtime'))
                }
              >
                <span className="font-medium capitalize">{topUpType}</span>
                <ChevronDown size={18} className="text-muted" />
              </button>
            </FormField>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-bold text-foreground"
              onClick={() => setAirtimeBeneficiaryPicker(true)}
            >
              <UserRound size={18} className="text-primary" />
              Select From Beneficiary
            </button>
            <FormField label="Phone Number">
              <Input
                inputMode="tel"
                maxLength={11}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter phone number"
              />
              {network.isFetching ? (
                <small>Detecting network…</small>
              ) : detectedProvider ? (
                <small className="text-success">
                  {detectedProvider.toUpperCase()}
                </small>
              ) : null}
            </FormField>
            {effectiveKind === 'data' ? (
              <FormField label="Data plan">
                <select
                  required
                  value={productId}
                  onChange={(e) => {
                    const plan = plans.data?.find(
                      (item) => item.productId === e.target.value,
                    );
                    setProductId(e.target.value);
                    if (plan) setAmount(String(plan.amount));
                  }}
                  className="h-12 w-full rounded-xl border bg-surface px-4"
                >
                  <option value="">Select</option>
                  {plans.data?.map((plan) => (
                    <option key={plan.productId} value={plan.productId}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </FormField>
            ) : null}
          </>
        )}

        {['electricity', 'cable-tv'].includes(effectiveKind) &&
          !preset?.billerId && (
            <FormField label="Select Provider">
              <button
                type="button"
                className="flex h-12 w-full items-center justify-between rounded-xl border px-4"
                onClick={() => setProviderPicker(true)}
              >
                <span className={providerName ? 'font-medium' : 'text-muted'}>
                  {providerName || 'Select'}
                </span>
                <ChevronDown size={18} className="text-muted" />
              </button>
            </FormField>
          )}

        {['electricity', 'cable-tv'].includes(effectiveKind) && (
          <>
            <FormField
              label={
                effectiveKind === 'electricity'
                  ? 'Account Number'
                  : 'Smart Card Number'
              }
            >
              <Input
                value={accountNumber}
                onChange={(e) => {
                  setAccountNumber(e.target.value);
                  setValidationReference('');
                }}
                placeholder={
                  effectiveKind === 'electricity'
                    ? 'enter account number'
                    : 'enter smart card number'
                }
              />
              {accountName ? (
                <small className="text-success">{accountName}</small>
              ) : null}
            </FormField>
          </>
        )}

        {!preset?.amount ? (
          <FormField label="Amount">
            <Input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter Amount in Figure"
            />
          </FormField>
        ) : null}

        {kind === 'transfer' && scope === 'external' && !wallet.hasNin ? (
          <FormField label="National Identification Number">
            <Input
              type="password"
              inputMode="numeric"
              maxLength={11}
              value={nin}
              onChange={(e) => setNin(e.target.value.replace(/\D/g, ''))}
            />
          </FormField>
        ) : null}

        {error ? <Alert tone="danger">{error}</Alert> : null}
        <p className="text-sm text-muted">
          <Link
            className="font-semibold text-primary underline"
            to="/app/security/transaction"
          >
            Set up your transaction PIN
          </Link>
        </p>
        <WalletPayBar
          type="submit"
          label={
            ['electricity', 'cable-tv'].includes(effectiveKind)
              ? 'Pay'
              : 'Continue'
          }
          loading={validateBill.isPending}
          disabled={!canContinue()}
        />
      </form>

      <WalletPickerSheet
        open={bankPicker}
        title="Select Bank"
        items={bankItems}
        selectedId={bankCode}
        onSelect={(id) => {
          const bank = bankItems.find((b) => b.id === id);
          setBankCode(id);
          setBankName(bank?.label ?? '');
          setAccountName('');
        }}
        onClose={() => setBankPicker(false)}
      />
      <WalletPickerSheet
        open={providerPicker}
        title="Select Provider"
        items={(billers.data ?? []).map((b) => ({ id: b.id, label: b.name }))}
        selectedId={provider}
        onSelect={(id) => {
          const item = billers.data?.find((b) => b.id === id);
          setProvider(id);
          setProviderName(item?.name ?? '');
        }}
        onClose={() => setProviderPicker(false)}
      />
      <WalletPickerSheet
        open={airtimeBeneficiaryPicker}
        title="Beneficiary"
        items={(beneficiaries.data ?? [])
          .filter((item) => item.scope === 'airtime')
          .map((item) => ({
            id: item.id,
            label: item.accountName,
            meta: `${item.bankName} · ${item.accountNumber}`,
          }))}
        onSelect={(id) => {
          const item = beneficiaries.data?.find((b) => b.id === id);
          if (!item) return;
          setPhone(item.accountNumber);
          setProviderName(item.bankName);
        }}
        onClose={() => setAirtimeBeneficiaryPicker(false)}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium capitalize">{value}</dd>
    </div>
  );
}

function BeneficiaryList({
  scope,
  items,
  onPick,
}: {
  scope: string;
  items: Array<{
    id: string;
    scope: string;
    accountName: string;
    bankName: string;
    accountNumber: string;
    bankCode: string | null;
  }>;
  onPick: (item: (typeof items)[number]) => void;
}) {
  const scoped = items.filter((item) => item.scope === scope);
  if (!scoped.length) return null;
  return (
    <div className="grid gap-2">
      <p className="text-sm font-bold">Beneficiary</p>
      <div className="grid gap-2">
        {scoped.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onPick(item)}
            className="rounded-2xl bg-primary-soft px-4 py-3 text-left"
          >
            <p className="font-bold">{item.accountName}</p>
            <p className="text-sm text-muted">
              {item.bankName} · {item.accountNumber}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
