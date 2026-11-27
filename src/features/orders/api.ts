import { apiRequest } from '../../api/client';

export type OrderStatus = 'DRAFT'|'QUOTED'|'PAYMENT_PROCESSING'|'PENDING'|'PAIRED'|'PICKUP'|'IN_TRANSIT'|'DELIVERED'|'COMPLETED'|'CANCELLATION_PROCESSING'|'CANCELLED'|'FAILED';
export type Order = {
  id: string; status: OrderStatus; paymentStatus: string; deliveryType: string; mobilityMethod?: string; orderKind: 'STANDARD'|'LARGE_COURIER';
  pickup: Address; delivery: Address; parcel: { category: string; name?: string; handling?: string; insuranceConsent?: boolean; weightKg?: number; dimensionsCm?: { length: number; width: number; height: number } };
  amount: { currency: string; minorUnits: number }; quoteExpiresAt?: string; distanceKm?: number; durationSeconds?: number; createdAt: string; updatedAt: string;
  scheduledAt?: string; returnOrder?: boolean; packageImageAssetId?: string;
};
export type Address = { address: string; city: string; state: string; country: string; landmark?: string; contactName: string; contactPhone: string };
export type QuoteInput = { deliveryType: string; mobilityMethod?: string; pickup: ProviderAddress; delivery: ProviderAddress; parcel: { category: string; description?: string; weightKg?: number; dimensionsCm?: { length: number; width: number; height: number }; handling: string; insuranceConsent?: boolean } };
export type QuickQuoteInput = {
  /** @deprecated Delivery type is inferred by the server. */
  deliveryType?: string;
  mobilityMethod?: string;
  pickup: { address: string; city: string; state: string; country?: string; landmark?: string };
  delivery: { address: string; city: string; state: string; country?: string; landmark?: string };
  parcel: { category: string };
  scheduledAt?: string;
  returnOrder: boolean;
  termsAccepted: true;
  packageImageAssetId?: string;
};
export type OrderDetailsPatch = Partial<Pick<QuoteInput, 'pickup' | 'delivery' | 'parcel'>> & { pickupLandmark?: string; deliveryLandmark?: string };
type ProviderAddress = { address: string; city: string; state: string; country: string; landmark?: string; contact: { name: string; phone: string; landmark?: string } };
const auth = (token: string) => ({ authorization: `Bearer ${token}` });
export const orderApi = {
  options: (token: string) => apiRequest<{ categories: string[]; handlingModes: string[]; lastMileVehicles: string[] }>('/orders/options', { headers: auth(token) }),
  uploadMedia: (token: string, photo: File) => { const body = new FormData(); body.append('photo', photo); return apiRequest<{ id: string }>('/orders/media', { method: 'POST', headers: auth(token), body }); },
  list: (token: string, limit = 20) => apiRequest<Order[]>(`/orders?limit=${limit}`, { headers: auth(token) }),
  get: (token: string, id: string) => apiRequest<Order>(`/orders/${encodeURIComponent(id)}`, { headers: auth(token) }),
  quote: (token: string, input: QuoteInput) => apiRequest<Order>('/orders/quotes', { method: 'POST', headers: auth(token), body: JSON.stringify(input) }),
  quickQuote: (token: string, input: QuickQuoteInput) =>
    apiRequest<Order>('/orders/quotes/quick', {
      method: 'POST',
      headers: auth(token),
      body: JSON.stringify(input),
    }),
  updateDetails: (token: string, id: string, patch: OrderDetailsPatch) =>
    apiRequest<Order>(`/orders/${encodeURIComponent(id)}/details`, {
      method: 'PATCH',
      headers: auth(token),
      body: JSON.stringify(patch),
    }),
  deliveryCode: (token: string, id: string) =>
    apiRequest<{ code: string }>(`/orders/${encodeURIComponent(id)}/delivery-code`, {
      headers: auth(token),
    }),
  confirmPickup: (token: string, id: string, code: string) =>
    apiRequest<Order>(`/orders/${encodeURIComponent(id)}/confirm-pickup`, {
      method: 'POST',
      headers: auth(token),
      body: JSON.stringify({ code }),
    }),
  pay: (token: string, id: string, pin: string, key: string) => apiRequest<Order>(`/orders/${encodeURIComponent(id)}/pay`, { method: 'POST', headers: { ...auth(token), 'Idempotency-Key': key }, body: JSON.stringify({ pin }) }),
  cancel: (token: string, id: string, reason: string, key: string) => apiRequest<Order>(`/orders/${encodeURIComponent(id)}/cancel`, { method: 'POST', headers: { ...auth(token), 'Idempotency-Key': key }, body: JSON.stringify({ reason }) }),
  tracking: (token: string, id: string) => apiRequest<{ latitude?: number; longitude?: number; updatedAt?: string; rider?: { name?: string; phone?: string; vehicle?: string; registration?: string; rating?: number } }>(`/orders/${encodeURIComponent(id)}/tracking`, { headers: auth(token) }),
  report: (token: string, id: string, category: string, description: string, key: string) => apiRequest<{ reference: string }>(`/orders/${encodeURIComponent(id)}/reports`, { method: 'POST', headers: { ...auth(token), 'Idempotency-Key': key }, body: JSON.stringify({ category, description }) }),
};
export const formatMoney = (money: Order['amount']) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: money.currency }).format(money.minorUnits / 100);
