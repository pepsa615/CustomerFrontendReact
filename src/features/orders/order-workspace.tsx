import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  FormField,
  Input,
  Select,
  Textarea,
} from '../../components/ui';
import { useAuth } from '../../contexts/auth-context';
import { formatMoney, orderApi, type Order, type QuoteInput } from './api';
import { completeOrderIntent, consumeOrderIntent } from './order-intent';

const initial: QuoteInput = {
  deliveryType: 'last_mile',
  mobilityMethod: 'motorcycle',
  pickup: {
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
    contact: { name: '', phone: '' },
  },
  delivery: {
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
    contact: { name: '', phone: '' },
  },
  parcel: {
    category: 'Mail and Small Parcel',
    description: '',
    handling: 'GENERAL',
    weightKg: 1,
    dimensionsCm: { length: 2, width: 3, height: 2 },
  },
};
const statuses: Record<string, string> = {
  QUOTED: 'Awaiting payment',
  PAYMENT_PROCESSING: 'Processing payment',
  PENDING: 'Awaiting dispatcher',
  PAIRED: 'Dispatcher paired',
  PICKUP: 'At pickup',
  IN_TRANSIT: 'In transit',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLATION_PROCESSING: 'Cancelling',
  CANCELLED: 'Cancelled',
  FAILED: 'Needs attention',
};

export function OrderWorkspace() {
  const { session } = useAuth();
  const token = session!.accessToken;
  const client = useQueryClient();
  const [intent] = useState(() => consumeOrderIntent());
  const [creating, setCreating] = useState(Boolean(intent));
  const [input, setInput] = useState<QuoteInput>(() => intent ? {
    ...initial,
    deliveryType: intent.deliveryType,
    pickup: { ...initial.pickup, ...intent.pickup, contact: { ...initial.pickup.contact, ...intent.pickup.contact } },
    delivery: { ...initial.delivery, ...intent.delivery, contact: { ...initial.delivery.contact, ...intent.delivery.contact } },
    parcel: { ...initial.parcel, ...intent.parcel },
  } : initial);
  const [quote, setQuote] = useState<Order>();
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const orders = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderApi.list(token),
  });
  const addressFields = (kind: 'pickup' | 'delivery', label: string) => (
    <Card>
      <h2 className="text-lg font-bold">{label}</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <FormField label="Street address" required>
          <Input
            value={input[kind].address}
            onChange={(e) =>
              setInput({
                ...input,
                [kind]: { ...input[kind], address: e.target.value },
              })
            }
            required
          />
        </FormField>
        <FormField label="City" required>
          <Input
            value={input[kind].city}
            onChange={(e) =>
              setInput({
                ...input,
                [kind]: { ...input[kind], city: e.target.value },
              })
            }
            required
          />
        </FormField>
        <FormField label="State" required>
          <Input
            value={input[kind].state}
            onChange={(e) =>
              setInput({
                ...input,
                [kind]: { ...input[kind], state: e.target.value },
              })
            }
            required
          />
        </FormField>
        <FormField label="Contact name" required>
          <Input
            value={input[kind].contact.name}
            onChange={(e) =>
              setInput({
                ...input,
                [kind]: {
                  ...input[kind],
                  contact: { ...input[kind].contact, name: e.target.value },
                },
              })
            }
            required
          />
        </FormField>
        <FormField label="Contact phone" required>
          <Input
            inputMode="tel"
            value={input[kind].contact.phone}
            onChange={(e) =>
              setInput({
                ...input,
                [kind]: {
                  ...input[kind],
                  contact: { ...input[kind].contact, phone: e.target.value },
                },
              })
            }
            required
          />
        </FormField>
      </div>
    </Card>
  );
  async function createQuote() {
    setBusy(true);
    setError('');
    try {
      setQuote(await orderApi.quote(token, input));
      completeOrderIntent();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create quote');
    } finally {
      setBusy(false);
    }
  }
  async function pay() {
    if (!quote) return;
    setBusy(true);
    setError('');
    try {
      const paid = await orderApi.pay(
        token,
        quote.id,
        pin,
        crypto.randomUUID(),
      );
      setQuote(paid);
      await client.invalidateQueries({ queryKey: ['orders'] });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Payment could not be confirmed',
      );
    } finally {
      setBusy(false);
    }
  }
  if (creating)
    return (
      <div className="grid gap-5">
        {error && (
          <Alert title="Could not continue" tone="danger">
            {error}
          </Alert>
        )}
        {quote ? (
          <>
            <Card>
              <h2 className="text-xl font-bold">Delivery summary</h2>
              <div className="mt-4 grid gap-3 text-sm">
                <p>
                  <b>Pickup:</b> {quote.pickup.address}, {quote.pickup.city}
                </p>
                <p>
                  <b>Delivery:</b> {quote.delivery.address},{' '}
                  {quote.delivery.city}
                </p>
                <p>
                  <b>Distance:</b> {quote.distanceKm ?? '—'} km · <b>ETA:</b>{' '}
                  {quote.durationSeconds
                    ? `${Math.ceil(quote.durationSeconds / 60)} mins`
                    : '—'}
                </p>
                <p className="text-xl font-bold text-primary">
                  {formatMoney(quote.amount)}
                </p>
              </div>
            </Card>
            {quote.status === 'QUOTED' ? (
              <Card>
                <FormField label="Transaction PIN" required>
                  <Input
                    inputMode="numeric"
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) =>
                      setPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                    }
                  />
                </FormField>
                <div className="mt-5 flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setQuote(undefined)}
                  >
                    Back
                  </Button>
                  <Button
                    loading={busy}
                    disabled={pin.length !== 4}
                    onClick={pay}
                  >
                    Pay & place order
                  </Button>
                </div>
              </Card>
            ) : (
              <Alert title="Order confirmed">
                Your order is now {statuses[quote.status].toLowerCase()}.{' '}
                <Link className="underline" to={`/app/orders/${quote.id}`}>
                  View delivery record
                </Link>
              </Alert>
            )}
          </>
        ) : (
          <form
            className="grid gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              void createQuote();
            }}
          >
            {addressFields('pickup', 'Pickup details')}
            {addressFields('delivery', 'Delivery details')}
            <Card>
              <h2 className="text-lg font-bold">Item information</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <FormField label="Delivery type">
                  <Select
                    value={input.deliveryType}
                    onChange={(e) =>
                      setInput({ ...input, deliveryType: e.target.value })
                    }
                  >
                    <option value="last_mile">Last-mile delivery</option>
                    <option value="interstate">Interstate delivery</option>
                  </Select>
                </FormField>
                <FormField label="Vehicle">
                  <Select
                    value={input.mobilityMethod}
                    onChange={(e) =>
                      setInput({ ...input, mobilityMethod: e.target.value })
                    }
                  >
                    <option value="motorcycle">Motorcycle</option>
                    <option value="tricycle">Tricycle</option>
                    <option value="car">Car</option>
                    <option value="van">Van</option>
                  </Select>
                </FormField>
                <FormField label="Category">
                  <Select
                    value={input.parcel.category}
                    onChange={(e) =>
                      setInput({
                        ...input,
                        parcel: { ...input.parcel, category: e.target.value },
                      })
                    }
                  >
                    <option>Mail and Small Parcel</option>
                    <option>Food and Essentials</option>
                    <option>Pharmaceutical Items</option>
                    <option>Electronics and Gadgets</option>
                    <option>Large Items and Others</option>
                  </Select>
                </FormField>
                <FormField label="Description">
                  <Textarea
                    value={input.parcel.description}
                    onChange={(e) =>
                      setInput({
                        ...input,
                        parcel: {
                          ...input.parcel,
                          description: e.target.value,
                        },
                      })
                    }
                  />
                </FormField>
              </div>
              <div className="mt-5 flex gap-3">
                <Button variant="secondary" onClick={() => setCreating(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={busy}>
                  Review quote
                </Button>
              </div>
            </Card>
          </form>
        )}
      </div>
    );
  return (
    <div>
      <div className="mb-5 flex justify-end">
        <Button onClick={() => setCreating(true)}>New order</Button>
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
                    <p className="font-bold">Order #{order.id}</p>
                    <p className="mt-1 text-sm text-muted">
                      {order.delivery.address}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">
                      {formatMoney(order.amount)}
                    </p>
                    <p className="text-xs text-muted">
                      {statuses[order.status]}
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
          description="Create a quote to start your first delivery."
        />
      )}
    </div>
  );
}
