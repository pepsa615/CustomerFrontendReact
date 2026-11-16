import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Alert, Button, Card, EmptyState } from '../../components/ui';
import { useAuth } from '../../contexts/auth-context';
import { formatMoney, orderApi } from './api';
import { consumeOrderIntent } from './order-intent';
import { orderStatusLabel } from './order-status';
import { OrderCreateFlow } from './order-create-flow';

export function OrderWorkspace() {
  const { session } = useAuth();
  const token = session!.accessToken;
  const [intent] = useState(() => consumeOrderIntent());
  const [creating, setCreating] = useState(Boolean(intent));
  const orders = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderApi.list(token),
  });

  if (creating) {
    return (
      <OrderCreateFlow
        token={token}
        onClose={() => setCreating(false)}
        initialRoute={
          intent
            ? {
                deliveryType: intent.deliveryType,
                pickup: intent.pickup,
                delivery: intent.delivery,
                parcel: intent.parcel,
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex justify-end">
        <Button onClick={() => setCreating(true)}>New delivery</Button>
      </div>
      {orders.isPending ? (
        <p>Loading orders…</p>
      ) : orders.isError ? (
        <Alert title="Orders unavailable" tone="danger">
          {orders.error.message}
        </Alert>
      ) : orders.data?.length ? (
        <div className="grid gap-3">
          {orders.data.map((order) => (
            <Link key={order.id} to={`/app/orders/${order.id}`}>
              <Card className="transition hover:border-primary">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">Delivery record #{order.id}</p>
                    <p className="mt-1 text-sm text-muted">
                      {order.delivery.address}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">
                      {formatMoney(order.amount)}
                    </p>
                    <p className="text-xs text-muted">
                      {orderStatusLabel(order.status)}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No orders yet"
          description="Get a route quote in seconds, then add pickup and package details."
        />
      )}
    </div>
  );
}
