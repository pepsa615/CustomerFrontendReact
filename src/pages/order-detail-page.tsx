import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Alert } from '../components/ui';
import { Page } from '../components/shared/page';
import { useAuth } from '../contexts/auth-context';
import { orderApi } from '../features/orders/api';
import { DeliveryRecordView } from '../features/orders/delivery-record-view';

export function Component() {
  const { id = '' } = useParams();
  const { session } = useAuth();
  const token = session!.accessToken;
  const client = useQueryClient();
  const order = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderApi.get(token, id),
    refetchInterval: 15_000,
  });
  const tracking = useQuery({
    queryKey: ['tracking', id],
    queryFn: () => orderApi.tracking(token, id),
    refetchInterval: 10_000,
    retry: false,
    enabled: Boolean(order.data && order.data.status !== 'QUOTED'),
  });

  if (order.isPending) {
    return (
      <Page title="Delivery record">
        <p>Loading delivery…</p>
      </Page>
    );
  }
  if (order.isError) {
    return (
      <Page title="Delivery record">
        <Alert title="Order unavailable" tone="danger">
          {order.error.message}
        </Alert>
      </Page>
    );
  }

  return (
    <Page
      title="Delivery record"
      description={`Ref #${order.data.id}`}
      actions={
        <Link className="text-sm font-semibold text-primary" to="/app/orders">
          All orders
        </Link>
      }
    >
      <DeliveryRecordView
        order={order.data}
        tracking={tracking.data}
        token={token}
        onRefresh={() => {
          void client.invalidateQueries({ queryKey: ['order', id] });
          void client.invalidateQueries({ queryKey: ['tracking', id] });
        }}
      />
    </Page>
  );
}