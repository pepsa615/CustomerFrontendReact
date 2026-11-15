import { Link } from 'react-router-dom';
import { Page } from '../components/shared/page';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, EmptyState } from '../components/ui';
import { useAuth } from '../contexts/auth-context';
import { formatMoney, orderApi } from '../features/orders/api';
export function Component() {
  const { session } = useAuth();
  const orders = useQuery({
    queryKey: ['orders', 'dashboard'],
    queryFn: () => orderApi.list(session!.accessToken, 5),
  });
  const active =
    orders.data?.filter(
      (order) =>
        !['DELIVERED', 'COMPLETED', 'CANCELLED', 'FAILED'].includes(
          order.status,
        ),
    ).length ?? 0;
  return (
    <Page
      title="Good day"
      description="Your delivery operations at a glance."
      actions={
        <Link to="/app/orders">
          <Button>Request delivery</Button>
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-muted">Wallet balance</p>
          <p className="mt-2 text-2xl font-bold">—</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Active orders</p>
          <p className="mt-2 text-2xl font-bold">{active}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Settlement</p>
          <p className="mt-2 text-2xl font-bold">—</p>
        </Card>
      </div>
      <div className="mt-6">
        {orders.data?.length ? (
          <div className="grid gap-3">
            {orders.data.map((order) => (
              <Link key={order.id} to={`/app/orders/${order.id}`}>
                <Card>
                  <div className="flex justify-between">
                    <div>
                      <p className="font-bold">Order #{order.id}</p>
                      <p className="text-sm text-muted">
                        {order.status.replaceAll('_', ' ')}
                      </p>
                    </div>
                    <p className="font-semibold text-primary">
                      {formatMoney(order.amount)}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No recent orders"
            description="Quotes and deliveries will appear here."
          />
        )}
      </div>
      <Link className="sr-only" to="/app/orders">
        View orders
      </Link>
    </Page>
  );
}
