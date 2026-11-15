import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { Page } from '../components/shared/page';
import { Card } from '../components/ui';
export function Component() {
  const { businessSlug = '', methodSlug = '', paymentSlug = '' } = useParams();
  const [token, setToken] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    apiRequest<{ token: string }>(
      `/business/${encodeURIComponent(businessSlug)}/${encodeURIComponent(methodSlug)}/${encodeURIComponent(paymentSlug)}`,
    )
      .then((value) => setToken(value.token))
      .catch(() => setFailed(true));
  }, [businessSlug, methodSlug, paymentSlug]);
  if (token) return <Navigate to={`/delivery/${token}`} replace />;
  return (
    <Page title="Delivery link" description="Opening secure PEPSA link">
      <Card>
        <p className="text-sm text-muted">
          {failed
            ? 'This link is invalid or no longer active.'
            : 'Checking this delivery link…'}
        </p>
      </Card>
    </Page>
  );
}
