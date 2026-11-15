import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  FormField,
  Select,
  Textarea,
} from '../components/ui';
import { Page } from '../components/shared/page';
import { useAuth } from '../contexts/auth-context';
import { formatMoney, orderApi } from '../features/orders/api';

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
  });
  const [reason, setReason] = useState('Plans changed');
  const [category, setCategory] = useState('DELAY');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  if (order.isPending)
    return (
      <Page title="Delivery record">
        <p>Loading delivery…</p>
      </Page>
    );
  if (order.isError)
    return (
      <Page title="Delivery record">
        <Alert title="Order unavailable" tone="danger">
          {order.error.message}
        </Alert>
      </Page>
    );
  const value = order.data;
  const cancellable = ['QUOTED', 'PAYMENT_PROCESSING', 'PENDING'].includes(
    value.status,
  );
  async function cancel() {
    setBusy(true);
    try {
      await orderApi.cancel(token, id, reason, crypto.randomUUID());
      setMessage('Order cancelled successfully.');
      await client.invalidateQueries({ queryKey: ['order', id] });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Cancellation failed');
    } finally {
      setBusy(false);
    }
  }
  async function report() {
    setBusy(true);
    try {
      const result = await orderApi.report(
        token,
        id,
        category,
        description,
        crypto.randomUUID(),
      );
      setMessage(`Report submitted: ${result.reference}`);
      setDescription('');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Report failed');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page
      title="Delivery record"
      description={`Ref No. #${value.id}`}
      actions={
        <Link className="text-sm text-primary" to="/app/orders">
          All orders
        </Link>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1.4fr_.8fr]">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted">Status</p>
              <p className="text-lg font-bold">
                {value.status.replaceAll('_', ' ')}
              </p>
            </div>
            <p className="font-bold text-primary">
              {formatMoney(value.amount)}
            </p>
          </div>
          <div className="mt-6 border-l-2 border-primary pl-5">
            <p className="font-semibold">Pickup</p>
            <p className="text-sm text-muted">
              {value.pickup.address}, {value.pickup.city}
            </p>
            <p className="mt-5 font-semibold">Delivery</p>
            <p className="text-sm text-muted">
              {value.delivery.address}, {value.delivery.city}
            </p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <p>
              Vehicle
              <br />
              <b>{value.mobilityMethod}</b>
            </p>
            <p>
              Distance
              <br />
              <b>{value.distanceKm ?? '—'} km</b>
            </p>
            <p>
              Category
              <br />
              <b>{value.parcel.category}</b>
            </p>
            <p>
              ETA
              <br />
              <b>
                {value.durationSeconds
                  ? `${Math.ceil(value.durationSeconds / 60)} mins`
                  : '—'}
              </b>
            </p>
          </div>
        </Card>
        <div className="grid gap-5">
          <Card>
            <h2 className="font-bold">Dispatcher tracking</h2>
            {tracking.data?.rider ? (
              <div className="mt-3 text-sm">
                <p className="text-lg font-semibold">
                  {tracking.data.rider.name}
                </p>
                <p>
                  {tracking.data.rider.vehicle}{' '}
                  {tracking.data.rider.registration}
                </p>
                <p>Rating: {tracking.data.rider.rating ?? '—'}</p>
                <div className="mt-4 flex gap-2">
                  {tracking.data.rider.phone && (
                    <>
                      <a
                        className="rounded-xl border px-4 py-3 font-semibold"
                        href={`tel:${tracking.data.rider.phone}`}
                      >
                        Call
                      </a>
                      <a
                        className="rounded-xl bg-primary px-4 py-3 font-semibold text-white"
                        href={`sms:${tracking.data.rider.phone}`}
                      >
                        Message
                      </a>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">
                Dispatcher details will appear after pairing.
              </p>
            )}
            {tracking.data?.latitude !== undefined && (
              <p className="mt-4 rounded-xl bg-surface-muted p-3 text-sm">
                Live location: {tracking.data.latitude.toFixed(5)},{' '}
                {tracking.data.longitude?.toFixed(5)}
              </p>
            )}
          </Card>
          {cancellable && (
            <Card>
              <h2 className="font-bold">Cancel order</h2>
              <FormField label="Reason">
                <Select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  <option>Plans changed</option>
                  <option>Incorrect details</option>
                  <option>Delivery delayed</option>
                </Select>
              </FormField>
              <Button
                className="mt-4"
                variant="danger"
                loading={busy}
                onClick={cancel}
              >
                Cancel order
              </Button>
            </Card>
          )}
        </div>
      </div>
      <Card className="mt-5">
        <h2 className="font-bold">Report an issue</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <FormField label="Category">
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="DELAY">Delay</option>
              <option value="RIDER">Rider</option>
              <option value="PACKAGE">Package</option>
              <option value="SAFETY">Safety</option>
              <option value="OTHER">Other</option>
            </Select>
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Description">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FormField>
          </div>
        </div>
        <Button
          className="mt-4"
          disabled={description.trim().length < 10}
          loading={busy}
          onClick={report}
        >
          Submit report
        </Button>
        {message && (
          <p role="status" className="mt-3 text-sm">
            {message}
          </p>
        )}
      </Card>
    </Page>
  );
}
