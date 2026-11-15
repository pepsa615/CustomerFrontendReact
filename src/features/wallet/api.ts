import { apiRequest } from '../../api/client';

export type WalletOverview = { id: string; currency: string; availableBalance: string; ledgerBalance: string; status: string; hasNin: boolean; maskedNin: string | null; fundingAccount: { accountNumber: string; accountName: string; bankName: string } | null };
export type WalletTransaction = { id: string; reference: string; type: string; status: string; amount: string; fee: string; currency: string; counterpartyName: string | null; counterpartyAccountMasked: string | null; provider: string | null; narration: string | null; failureCode: string | null; createdAt: string; completedAt: string | null };
export type Beneficiary = { id: string; scope: string; accountNumber: string; bankCode: string | null; bankName: string; accountName: string };
export type Bank = { id?: string; code?: string; name?: string; attributes?: { nipCode?: string; name?: string } };

const auth = (token: string) => ({ authorization: `Bearer ${token}` });
export const walletApi = {
  overview: (token: string) => apiRequest<WalletOverview>('/wallet', { headers: auth(token) }),
  transactions: (token: string, search = '') => apiRequest<{ items: WalletTransaction[]; nextCursor: string | null }>(`/wallet/transactions?limit=50${search ? `&search=${encodeURIComponent(search)}` : ''}`, { headers: auth(token) }),
  detail: (token: string, id: string) => apiRequest<WalletTransaction>(`/wallet/transactions/${id}`, { headers: auth(token) }),
  beneficiaries: (token: string) => apiRequest<Beneficiary[]>('/wallet/beneficiaries', { headers: auth(token) }),
  banks: (token: string) => apiRequest<Bank[]>('/wallet/banks', { headers: auth(token) }),
  resolve: (token: string, body: unknown, signal?: AbortSignal) => apiRequest<{ accountNumber: string; accountName: string; bankCode: string; bankName: string }>('/wallet/accounts/resolve', { method: 'POST', headers: auth(token), body: JSON.stringify(body) }, signal),
  saveNin: (token: string, nin: string) => apiRequest('/wallet/nin', { method: 'POST', headers: auth(token), body: JSON.stringify({ nin }) }),
  transfer: (token: string, scope: 'internal' | 'external', body: unknown, key: string) => apiRequest<WalletTransaction>(`/wallet/transfers/${scope}`, { method: 'POST', headers: { ...auth(token), 'Idempotency-Key': key }, body: JSON.stringify(body) }),
  detectNetwork: (token: string, phone: string, signal?: AbortSignal) => apiRequest<{ network: string; phone: string }>(`/vas/networks/detect?phoneNumber=${encodeURIComponent(phone)}`, { headers: auth(token) }, signal),
  plans: (token: string, phone: string) => apiRequest<Array<{ productId: string; name: string; amount: number }>>(`/vas/data-plans?phoneNumber=${encodeURIComponent(phone)}`, { headers: auth(token) }),
  categories: (token: string) => apiRequest<Array<{ id: string; name: string }>>('/vas/billers/categories', { headers: auth(token) }),
  billers: (token: string, category: string) => apiRequest<Array<{ id: string; name: string }>>(`/vas/billers/categories/${category}`, { headers: auth(token) }),
  validateBiller: (token: string, body: unknown) => apiRequest<{ validationReference: string; customerName: string }>('/vas/billers/validate', { method: 'POST', headers: auth(token), body: JSON.stringify(body) }),
  purchase: (token: string, path: string, body: unknown, key: string) => apiRequest<WalletTransaction>(`/vas/${path}`, { method: 'POST', headers: { ...auth(token), 'Idempotency-Key': key }, body: JSON.stringify(body) }),
};
