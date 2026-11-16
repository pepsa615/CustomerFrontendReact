export function money(value: string | number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(Number(value));
}

export function label(value: string) {
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());
}

export function transactionTitle(tx: {
  type: string;
  counterpartyName: string | null;
  provider: string | null;
  narration: string | null;
}) {
  if (tx.counterpartyName) return tx.counterpartyName;
  if (tx.narration) return tx.narration;
  if (tx.provider) return `${label(tx.type)} (${tx.provider.toUpperCase()})`;
  return label(tx.type);
}

export function formatHistoryWhen(iso: string) {
  const d = new Date(iso);
  const day = d.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? 'st'
      : day % 10 === 2 && day !== 12
        ? 'nd'
        : day % 10 === 3 && day !== 13
          ? 'rd'
          : 'th';
  const month = d.toLocaleString('en-GB', { month: 'short' });
  const time = d.toLocaleTimeString('en-GB', { hour12: false });
  return `${month} ${day}${suffix}, ${time}`;
}

export function statusTone(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === 'SUCCESSFUL' || normalized === 'COMPLETED')
    return 'text-success';
  if (normalized === 'REVERSED' || normalized === 'FAILED')
    return 'text-warning';
  return 'text-muted';
}