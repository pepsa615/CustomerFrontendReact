import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import type { TransactionReadiness } from './registration-flow';

export function useTransactionReadiness(token: string | undefined) {
  return useQuery({
    queryKey: ['transaction-readiness'],
    enabled: Boolean(token),
    queryFn: () =>
      apiRequest<TransactionReadiness>('/account/transaction-readiness', {
        headers: { authorization: `Bearer ${token}` },
      }),
  });
}