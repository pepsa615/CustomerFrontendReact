export type WalletFlowAction =
  | 'deposit'
  | 'history'
  | 'transfer'
  | 'airtime'
  | 'data'
  | 'bills'
  | 'electricity'
  | 'cable-tv';

export type PaymentKind =
  | 'transfer'
  | 'airtime'
  | 'data'
  | 'electricity'
  | 'cable-tv';

export function parseWalletAction(
  value: string | null,
): WalletFlowAction | null {
  if (!value) return null;
  const allowed: WalletFlowAction[] = [
    'deposit',
    'history',
    'transfer',
    'airtime',
    'data',
    'bills',
    'electricity',
    'cable-tv',
  ];
  return allowed.includes(value as WalletFlowAction)
    ? (value as WalletFlowAction)
    : null;
}

export function paymentKindFromAction(
  action: WalletFlowAction,
): PaymentKind | null {
  if (action === 'bills') return null;
  if (
    action === 'transfer' ||
    action === 'airtime' ||
    action === 'data' ||
    action === 'electricity' ||
    action === 'cable-tv'
  ) {
    return action;
  }
  return null;
}