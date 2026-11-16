import { useState } from 'react';
import { Bike, Box, Clock, MapPin, Phone, Route, Truck } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  Dialog,
  FormField,
  Input,
} from '../../components/ui';
import { formatMoney, orderApi, type Order } from './api';
import { orderStatusLabel, orderStatusTone } from './order-status';

export function DeliveryRecordView({
  order,
  tracking,
  token,
  onRefresh,
}: {
  order: Order;
  tracking?: {
    latitude?: number;
    longitude?: number;
    rider?: {
      name?: string;
      phone?: string;
      vehicle?: string;
      registration?: string;
      rating?: number;
    };
  };
  token: string;
  onRefresh: () => void;
}) {
  const [pickupOpen, setPickupOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [deliveryCode, setDeliveryCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const cancellable = ['QUOTED', 'PAYMENT_PROCESSING', 'PENDING'].includes(
    order.status,
  );

  const showCodes = !['QUOTED', 'CANCELLED'].includes(order.status);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,.75fr)]">
      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-surface-muted p-5">
          <div>
            <p className="text-sm text-muted">Ref No. #{order.id}</p>
            <p className="text-xs text-muted">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <span
            className={`rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold capitalize ${orderStatusTone(order.status)}`}
          >
            {orderStatusLabel(order.status)}
          </span>
        </div>
        <h2 className="px-5 pt-5 text-lg font-bold">Order Detail</h2>
        <div className="grid gap-5 p-5">
          <div className="grid gap-4 border-l-2 border-dashed border-primary/40 pl-5">
            <div>
              <p className="flex items-center gap-2 font-semibold text-primary">
                <MapPin size={16} /> Pickup Information
              </p>
              <p className="text-sm text-muted">
                {order.pickup.address}, {order.pickup.city}, {order.pickup.state}
              </p>
            </div>
            <div>
              <p className="flex items-center gap-2 font-semibold text-success">
                <MapPin size={16} /> Delivery Location
              </p>
              <p className="text-sm text-muted">
                {order.delivery.address}, {order.delivery.city},{' '}
                {order.delivery.state}
              </p>
            </div>
          </div>
          <MetaGrid order={order} />
          <div className="grid gap-4 sm:grid-cols-2">
            <ContactCard
              title="Pickup Details"
              name={order.pickup.contactName}
              phone={order.pickup.contactPhone}
              onEnterCode={showCodes ? () => setPickupOpen(true) : undefined}
            />
            <ContactCard
              title="Delivery Details"
              name={order.delivery.contactName}
              phone={order.delivery.contactPhone}
              onEnterCode={showCodes ? () => setDeliveryOpen(true) : undefined}
            />
          </div>
          <p className="text-right text-2xl font-bold text-primary">
            {formatMoney(order.amount)}
          </p>
          {order.status === 'QUOTED' ? (
            <p className="text-center text-sm text-muted">
              Pay for this order to dispatch a rider.
            </p>
          ) : null}
          {cancellable ? (
            <Button
              variant="danger"
              loading={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await orderApi.cancel(
                    token,
                    order.id,
                    'Plans changed',
                    crypto.randomUUID(),
                  );
                  setMessage('Order cancelled.');
                  onRefresh();
                } catch (e) {
                  setMessage(
                    e instanceof Error ? e.message : 'Cancellation failed',
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              Cancel Order
            </Button>
          ) : null}
        </div>
      </Card>
      <div className="grid gap-5">
        <Card>
          <h3 className="font-bold">Dispatcher</h3>
          {tracking?.rider ? (
            <div className="mt-4 grid gap-2 text-sm">
              <p className="text-lg font-semibold">{tracking.rider.name}</p>
              <p>
                {tracking.rider.vehicle} · {tracking.rider.registration}
              </p>
              <p>Rating: {tracking.rider.rating ?? '—'}</p>
              {tracking.rider.phone ? (
                <div className="mt-2 flex gap-2">
                  <a
                    className="flex-1 rounded-xl border py-3 text-center font-semibold"
                    href={`tel:${tracking.rider.phone}`}
                  >
                    Call Rider
                  </a>
                  <a
                    className="flex-1 rounded-xl bg-primary py-3 text-center font-semibold text-primary-foreground"
                    href={`sms:${tracking.rider.phone}`}
                  >
                    Message
                  </a>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">
              {order.status === 'PENDING'
                ? 'Awaiting to pair order with a Dispatcher.'
                : 'Dispatcher details will appear after pairing.'}
            </p>
          )}
        </Card>
        {message ? <Alert>{message}</Alert> : null}
      </div>
      <PickupConfirmDialog
        open={pickupOpen}
        code={confirmCode}
        onChange={setConfirmCode}
        onClose={() => setPickupOpen(false)}
        onSubmit={async () => {
          setBusy(true);
          try {
            await orderApi.confirmPickup(token, order.id, confirmCode);
            setPickupOpen(false);
            onRefresh();
          } catch (e) {
            setMessage(e instanceof Error ? e.message : 'Invalid code');
          } finally {
            setBusy(false);
          }
        }}
        loading={busy}
      />
      <DeliveryCodeDialog
        open={deliveryOpen}
        onClose={() => setDeliveryOpen(false)}
        onOpen={async () => {
          const value = await orderApi.deliveryCode(token, order.id);
          setDeliveryCode(value.code);
        }}
        code={deliveryCode}
      />
    </div>
  );
}

function MetaGrid({ order }: { order: Order }) {
  return (
    <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
      <Meta icon={Truck} label="Service" value="Last-mile Delivery" />
      <Meta icon={Bike} label="Vehicle" value={order.mobilityMethod} />
      <Meta
        icon={Route}
        label="Distance"
        value={`${order.distanceKm ?? '—'} km`}
      />
      <Meta
        icon={Clock}
        label="Est. time"
        value={
          order.durationSeconds
            ? `${Math.ceil(order.durationSeconds / 60)} mins`
            : '—'
        }
      />
      <Meta icon={Box} label="Category" value={order.parcel.category} />
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Truck;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-2 text-muted">
        <Icon size={16} />
        {label}
      </p>
      <p className="font-semibold capitalize">{value}</p>
    </div>
  );
}

function ContactCard({
  title,
  name,
  phone,
  onEnterCode,
}: {
  title: string;
  name: string;
  phone: string;
  onEnterCode?: () => void;
}) {
  return (
    <div className="rounded-2xl border p-4">
      <p className="font-bold">{title}</p>
      <p className="mt-1 font-medium">{name}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        {phone ? (
          <a className="text-primary" href={`tel:${phone}`}>
            <Phone size={18} />
          </a>
        ) : null}
        {onEnterCode ? (
          <button
            type="button"
            className="text-sm font-semibold text-primary"
            onClick={onEnterCode}
          >
            Enter deliver code
          </button>
        ) : null}
      </div>
    </div>
  );
}

function PickupConfirmDialog({
  open,
  code,
  onChange,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean;
  code: string;
  onChange: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <Dialog open={open} title="Confirmation Code" onClose={onClose}>
      <FormField label="Enter code">
        <Input value={code} onChange={(e) => onChange(e.target.value)} />
      </FormField>
      <Button className="mt-4 w-full" loading={loading} onClick={onSubmit}>
        Confirm
      </Button>
    </Dialog>
  );
}

function DeliveryCodeDialog({
  open,
  onClose,
  onOpen,
  code,
}: {
  open: boolean;
  onClose: () => void;
  onOpen: () => Promise<void>;
  code: string;
}) {
  return (
    <Dialog open={open} title="Pickup Code" onClose={onClose}>
      {open && !code ? (
        <Button className="w-full" onClick={() => void onOpen()}>
          Show code
        </Button>
      ) : (
        <p className="text-center text-4xl font-bold tracking-widest">
          {code || '—'}
        </p>
      )}
    </Dialog>
  );
}