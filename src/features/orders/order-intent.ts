import type { QuoteInput } from './api';

const key = 'pepsa.pending-order';

type OrderIntent = Pick<QuoteInput, 'deliveryType' | 'pickup' | 'delivery'> & {
  parcel?: Pick<QuoteInput['parcel'], 'category'>;
};

const clean = (value: string | null, max = 180) => (value ?? '').trim().slice(0, max);

export function captureOrderIntent(search: string) {
  const params = new URLSearchParams(search);
  if (params.get('intent') !== 'create-order') return;
  const intent: OrderIntent = {
    deliveryType: params.get('deliveryType') === 'interstate' ? 'interstate' : 'last_mile',
    pickup: {
      address: clean(params.get('pickupAddress')),
      city: clean(params.get('pickupCity'), 80),
      state: '',
      country: 'Nigeria',
      contact: { name: '', phone: '' },
    },
    delivery: {
      address: clean(params.get('deliveryAddress')),
      city: clean(params.get('deliveryCity'), 80),
      state: '',
      country: 'Nigeria',
      contact: { name: '', phone: '' },
    },
    parcel: { category: clean(params.get('category'), 80) || 'Mail and Small Parcel' },
  };
  sessionStorage.setItem(key, JSON.stringify(intent));
  window.history.replaceState({}, '', window.location.pathname);
}

export function hasOrderIntent() {
  return Boolean(sessionStorage.getItem(key));
}

export function consumeOrderIntent(): OrderIntent | undefined {
  const stored = sessionStorage.getItem(key);
  if (!stored) return;
  try {
    return JSON.parse(stored) as OrderIntent;
  } catch {
    sessionStorage.removeItem(key);
  }
}

export function completeOrderIntent() {
  sessionStorage.removeItem(key);
}

export function postAuthDestination() {
  return hasOrderIntent() ? '/app/orders' : '/app';
}
