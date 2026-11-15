import { apiRequest } from '../../api/client';

export type BusinessCategory = { value: string; label: string };
export type DeliveryLink = { id: string; token: string; pickupSource: 'customer'|'business'; paymentBy: 'customer'|'vendor'; active: boolean; url: string };
export type Money = { currency: string; minorUnits: number };
export type Draft = { id: string; status: string; paymentStatus: string; pickup: Address; delivery: Address; parcel: { category: string; weightKg?: number }; amount: Money; quoteExpiresAt?: string; sentOutAt?: string; createdAt: string };
export type Address = { address: string; city: string; state: string; country: string; contactName: string; contactPhone: string };
export type Settlement = { status: 'PENDING'|'READY'|'FAILED'; balance: Money; entries: { id: string; direction: string; amountMinor: number; currency: string; description: string; createdAt: string }[] };
export type PublicLink = { token: string; pickupSource: 'customer'|'business'; paymentBy: 'customer'|'vendor'; business: { name: string; category: string; logoUrl?: string } };
export type PublicSubmission = { customerLocation: { address: string; city: string; state: string; country: string; landmark?: string; contact: { name: string; phone: string } }; deliveryType: 'last_mile'|'interstate'; mobilityMethod: string; scheduledAt?: string; parcel: { category: string; description?: string; quantity: number; weightKg: number; dimensionsCm: { length: number; width: number; height: number }; handling: string; inspectionConsent: true } };
const auth = (token: string) => ({ authorization: `Bearer ${token}` });
export const deliveryLinksApi = {
  categories: () => apiRequest<BusinessCategory[]>('/delivery-links/categories'),
  business: (token: string) => apiRequest<{ business: Record<string, unknown>; links: DeliveryLink[] }>('/business', { headers: auth(token) }),
  saveBusiness: (token: string, input: FormData) => apiRequest<{ business: Record<string, unknown>; links: DeliveryLink[] }>('/business', { method: 'POST', headers: auth(token), body: input }),
  updateBusiness: (token: string, input: FormData) => apiRequest<{ business: Record<string, unknown> }>('/business', { method: 'PATCH', headers: auth(token), body: input }),
  retrySettlement: (token: string) => apiRequest('/business/settlement/retry', { method: 'POST', headers: auth(token), body: '{}' }),
  links: (token: string) => apiRequest<DeliveryLink[]>('/delivery-links', { headers: auth(token) }),
  setActive: (token: string, linkToken: string, active: boolean) => apiRequest(`/delivery-links/${linkToken}`, { method: 'PATCH', headers: auth(token), body: JSON.stringify({ active }) }),
  drafts: (token: string) => apiRequest<Draft[]>('/delivery-links/drafts/list', { headers: auth(token) }),
  settlement: (token: string) => apiRequest<Settlement>('/delivery-links/settlement/summary', { headers: auth(token) }),
  sendOut: (token: string, id: string, pin: string) => apiRequest<Draft>(`/delivery-links/drafts/${encodeURIComponent(id)}/send-out`, { method: 'POST', headers: { ...auth(token), 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ pin }) }),
  resolve: (linkToken: string) => apiRequest<PublicLink>(`/delivery-links/public/${linkToken}`),
  submit: (linkToken: string, input: PublicSubmission) => apiRequest<{ submissionRef: string; requiresPayment: boolean; order: Draft }>(`/delivery-links/public/${linkToken}/submissions`, { method: 'POST', body: JSON.stringify(input) }),
  confirm: (linkToken: string, submissionRef: string) => apiRequest<{ requiresPayment: boolean; order: Draft }>(`/delivery-links/public/${linkToken}/submissions/${submissionRef}/confirm`, { method: 'POST', body: '{}' }),
  checkout: (linkToken: string, submissionRef: string) => apiRequest<{ checkoutId: string; status: string; accountNumber: string; bankName: string; amount: number; currency: string; expiresAt: string }>(`/delivery-links/public/${linkToken}/checkouts`, { method: 'POST', body: JSON.stringify({ submissionRef }) }),
  checkoutStatus: (linkToken: string, checkoutId: string) => apiRequest<{ status: string; paid: boolean }>(`/delivery-links/public/${linkToken}/checkouts/${encodeURIComponent(checkoutId)}`),
};
export const formatMoney = (value: Money) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: value.currency }).format(value.minorUnits / 100);
