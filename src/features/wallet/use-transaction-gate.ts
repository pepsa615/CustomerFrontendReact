import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { walletApi } from './api';

export function useTransactionGate(token: string, active: boolean) {
  const navigate = useNavigate();
  const readiness = useQuery({
    queryKey: ['transaction-readiness'],
    queryFn: () => walletApi.readiness(token),
    enabled: Boolean(token) && active,
  });

  useEffect(() => {
    if (!active || !readiness.data) return;
    if (!readiness.data.kycComplete) {
      navigate('/app/kyc', { replace: true });
      return;
    }
    if (!readiness.data.phoneVerified || !readiness.data.pinSet) {
      navigate('/app/security/transaction', { replace: true });
    }
  }, [active, navigate, readiness.data]);

  return readiness;
}