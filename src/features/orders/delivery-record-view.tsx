import { useState } from 'react';
import {
  Bike,
  Box,
  Clock3,
  EyeOff,
  MapPin,
  MessageSquare,
  Phone,
  Route,
  Send,
  Star,
  Truck,
} from 'lucide-react';
import {
  Alert,
  Button,
  Dialog,
  FormField,
  Input,
  Textarea,
} from '../../components/ui';
import { formatMoney, orderApi, type Order } from './api';
import { orderStatusLabel } from './order-status';

type Tracking = {
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

export function DeliveryRecordView({
  order,
  tracking,
  token,
  onRefresh,
}: {
  order: Order;
  tracking?: Tracking;
  token: string;
  onRefresh: () => void;
}) {
  const [dialog, setDialog] = useState<
    'pickup' | 'delivery' | 'pay' | 'report' | null
  >(null);
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const isPayable = order.status === 'QUOTED' && order.orderKind === 'STANDARD';
  const isPending = order.status === 'PENDING';
  const hasDispatcher = ['PAIRED', 'PICKUP', 'IN_TRANSIT'].includes(
    order.status,
  );
  const showContacts = order.status !== 'COMPLETED';
  const showCodes = ['PAIRED', 'PICKUP', 'IN_TRANSIT', 'DELIVERED'].includes(
    order.status,
  );
  const showReport = ['PAIRED', 'PICKUP', 'IN_TRANSIT', 'DELIVERED'].includes(
    order.status,
  );
  const cancellable = ['QUOTED', 'PAYMENT_PROCESSING', 'PENDING'].includes(
    order.status,
  );

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setMessage('');
    try {
      await action();
      setMessage(success);
      setDialog(null);
      onRefresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'The action could not be completed.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[760px]">
      <section className="min-h-[70vh] overflow-hidden border bg-surface shadow-sm">
        <div className="m-5 flex items-center justify-between gap-4 rounded-xl bg-surface-muted px-5 py-5">
          <div>
            <p className="font-bold sm:text-xl">
              <span className="mr-2 text-blue-600">●</span>Ref No. #{order.id}
            </p>
            <p className="mt-1 text-sm text-muted sm:text-base">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <span className="rounded bg-primary-soft px-5 py-2 text-sm font-semibold">
            {orderStatusLabel(order.status)}
          </span>
        </div>
        <div className="border-t bg-surface-muted/25 p-5 sm:p-7">
          <div className="bg-surface p-4 sm:p-6">
            <h2 className="text-lg font-bold">
              {order.status === 'DRAFT' ? 'Report' : 'Order Detail'}
            </h2>
            <RouteBlock order={order} />
            <MetaGrid order={order} />
            {showContacts ? (
              <div className="mt-4 border-t">
                <ContactRow
                  title="Pickup Details"
                  name={order.pickup.contactName}
                  phone={order.pickup.contactPhone}
                  showCode={showCodes}
                  onCode={() => setDialog('pickup')}
                />
                <ContactRow
                  title="Delivery Details"
                  name={order.delivery.contactName}
                  phone={order.delivery.contactPhone}
                  showCode={showCodes}
                  onCode={() => setDialog('delivery')}
                />
              </div>
            ) : null}
            {hasDispatcher ? <Dispatcher tracking={tracking} /> : null}
            {isPayable ? (
              <div className="mt-8">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Delivery Fee</span>
                  <span className="text-[#06457c]">
                    {formatMoney(order.amount)}
                  </span>
                </div>
                <p className="mt-8 text-center">
                  Order placed by {order.pickup.contactName || 'customer'}. Pay
                  for the order
                </p>
                <div className="mt-8 flex justify-between gap-4">
                  <Button
                    className="min-w-32 bg-[#062f54]"
                    onClick={() =>
                      void run(
                        () =>
                          orderApi.cancel(
                            token,
                            order.id,
                            'Plans changed',
                            crypto.randomUUID(),
                          ),
                        'Order cancelled.',
                      )
                    }
                  >
                    Cancel
                  </Button>
                  <Button className="min-w-32" onClick={() => setDialog('pay')}>
                    Pay
                  </Button>
                </div>
              </div>
            ) : null}
            {isPending ? (
              <div className="mt-12 text-center">
                <p className="text-lg">
                  Awaiting to pair order with a Dispatcher
                </p>
                <Button
                  className="mt-8 min-w-44"
                  variant="danger"
                  loading={busy}
                  onClick={() =>
                    void run(
                      () =>
                        orderApi.cancel(
                          token,
                          order.id,
                          'Plans changed',
                          crypto.randomUUID(),
                        ),
                      'Order cancelled.',
                    )
                  }
                >
                  Cancel Order
                </Button>
              </div>
            ) : null}
            {showReport ? (
              <div className="mt-10 text-center">
                <Button
                  className="min-w-44"
                  variant="danger"
                  onClick={() => setDialog('report')}
                >
                  Report Order
                </Button>
              </div>
            ) : null}
            {cancellable && !isPayable && !isPending ? (
              <div className="mt-8 text-center">
                <Button
                  variant="danger"
                  loading={busy}
                  onClick={() =>
                    void run(
                      () =>
                        orderApi.cancel(
                          token,
                          order.id,
                          'Plans changed',
                          crypto.randomUUID(),
                        ),
                      'Order cancelled.',
                    )
                  }
                >
                  Cancel Order
                </Button>
              </div>
            ) : null}
            {message ? (
              <div className="mt-5">
                <Alert>{message}</Alert>
              </div>
            ) : null}
          </div>
        </div>
      </section>
      <Dialog
        open={dialog === 'pickup'}
        title="Confirmation Code"
        onClose={() => setDialog(null)}
      >
        <FormField label="Enter code">
          <Input
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </FormField>
        <Button
          className="mt-4 w-full"
          loading={busy}
          onClick={() =>
            void run(
              () => orderApi.confirmPickup(token, order.id, code),
              'Pickup confirmed.',
            )
          }
        >
          Confirm
        </Button>
      </Dialog>
      <Dialog
        open={dialog === 'delivery'}
        title="Delivery Code"
        onClose={() => setDialog(null)}
      >
        <Button
          className="w-full"
          loading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const result = await orderApi.deliveryCode(token, order.id);
              setMessage(`Delivery code: ${result.code}`);
              setDialog(null);
            } catch (error) {
              setMessage(
                error instanceof Error
                  ? error.message
                  : 'Delivery code unavailable.',
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          Show delivery code
        </Button>
      </Dialog>
      <Dialog
        open={dialog === 'pay'}
        title="Pay for order"
        onClose={() => setDialog(null)}
      >
        <FormField label="Transaction PIN">
          <Input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) =>
              setPin(e.target.value.replace(/\D/g, '').slice(0, 4))
            }
          />
        </FormField>
        <Button
          className="mt-4 w-full"
          disabled={pin.length !== 4}
          loading={busy}
          onClick={() =>
            void run(
              () => orderApi.pay(token, order.id, pin, crypto.randomUUID()),
              'Payment successful.',
            )
          }
        >
          Pay {formatMoney(order.amount)}
        </Button>
      </Dialog>
      <Dialog
        open={dialog === 'report'}
        title="Report order"
        onClose={() => setDialog(null)}
      >
        <FormField label="What happened?">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>
        <Button
          className="mt-4 w-full"
          disabled={description.trim().length < 10}
          loading={busy}
          onClick={() =>
            void run(
              () =>
                orderApi.report(
                  token,
                  order.id,
                  'OTHER',
                  description,
                  crypto.randomUUID(),
                ),
              'Report submitted.',
            )
          }
        >
          Submit report
        </Button>
      </Dialog>
    </div>
  );
}

function RouteBlock({ order }: { order: Order }) {
  return (
    <div className="relative mt-4 grid gap-3 pl-8 before:absolute before:left-[7px] before:top-4 before:h-14 before:border-l-4 before:border-dotted before:border-emerald-500">
      <div>
        <MapPin
          className="absolute left-0 text-rose-500"
          size={17}
          fill="currentColor"
        />
        <p className="font-bold">Pickup Information</p>
        <p className="ml-3 mt-1 text-sm text-muted">
          {[order.pickup.address, order.pickup.city, order.pickup.state]
            .filter(Boolean)
            .join(', ')}
        </p>
      </div>
      <div>
        <span className="absolute left-[1px] mt-1 size-3 rounded-full border-2 border-emerald-500 bg-surface" />
        <p className="font-bold">Delivery Location</p>
        <p className="ml-3 mt-1 text-sm text-muted">
          {[order.delivery.address, order.delivery.city, order.delivery.state]
            .filter(Boolean)
            .join(', ')}
        </p>
      </div>
    </div>
  );
}

function MetaGrid({ order }: { order: Order }) {
  const service =
    order.orderKind === 'LARGE_COURIER'
      ? 'Large Courier'
      : order.deliveryType === 'INTERSTATE'
        ? 'Interstate Delivery'
        : 'Last-mile Delivery';
  return (
    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
      <Meta icon={Truck} value={service} />
      {order.mobilityMethod ? (
        <Meta icon={Bike} value={order.mobilityMethod} right />
      ) : (
        <span />
      )}
      <Meta icon={Route} value={`${order.distanceKm ?? '—'} km`} />
      <Meta
        icon={Clock3}
        value={
          order.durationSeconds
            ? `${Math.ceil(order.durationSeconds / 60)} mins`
            : '—'
        }
        right
      />
      <Meta icon={Box} value={order.parcel.category} />
      <span className="text-right">---</span>
    </div>
  );
}
function Meta({
  icon: Icon,
  value,
  right,
}: {
  icon: typeof Truck;
  value: string;
  right?: boolean;
}) {
  return (
    <span
      className={`flex items-center gap-3 capitalize ${right ? 'justify-end' : ''}`}
    >
      <Icon size={17} />
      {value}
    </span>
  );
}

function ContactRow({
  title,
  name,
  phone,
  showCode,
  onCode,
}: {
  title: string;
  name: string;
  phone: string;
  showCode: boolean;
  onCode: () => void;
}) {
  return (
    <div className="py-5">
      <div className="flex justify-between">
        <h3 className="font-bold">{title}</h3>
        <Send size={17} className="text-primary" />
      </div>
      <div className="mt-4 flex items-center justify-between border-b pb-2">
        <span className="pl-3 text-sm">{name || '—'}</span>
        {phone ? (
          <a aria-label={`Call ${name}`} href={`tel:${phone}`}>
            <Phone size={18} />
          </a>
        ) : null}
      </div>
      {showCode ? (
        <button
          type="button"
          className="mt-3 flex w-full items-center justify-end gap-1 text-primary"
          onClick={onCode}
        >
          <EyeOff size={18} /> Enter deliver code
        </button>
      ) : null}
    </div>
  );
}

function Dispatcher({ tracking }: { tracking?: Tracking }) {
  const rider = tracking?.rider;
  if (!rider)
    return (
      <p className="mt-8 text-center text-muted">
        Dispatcher details will appear after pairing.
      </p>
    );
  return (
    <div className="mt-4">
      <h3 className="font-bold">Dispatcher Details</h3>
      <div className="mt-3 flex items-center gap-4">
        <div className="grid size-20 place-items-center rounded border bg-surface-muted text-3xl">
          👤
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold">{rider.name}</p>
          <p className="text-sm text-muted">
            {rider.vehicle}{' '}
            {rider.registration ? `· ${rider.registration}` : ''}
          </p>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted">
            <Star size={15} fill="#fbbf24" className="text-amber-400" />{' '}
            {rider.rating ?? '—'}
          </p>
        </div>
        {rider.phone ? (
          <div className="flex gap-3">
            <a aria-label="Call dispatcher" href={`tel:${rider.phone}`}>
              <Phone />
            </a>
            <a aria-label="Message dispatcher" href={`sms:${rider.phone}`}>
              <MessageSquare />
            </a>
          </div>
        ) : null}
      </div>
      {tracking?.latitude != null ? (
        <a
          className="mt-3 flex justify-end gap-1 text-sm text-primary"
          href={`https://maps.google.com/?q=${tracking.latitude},${tracking.longitude}`}
          target="_blank"
          rel="noreferrer"
        >
          <MapPin size={18} fill="currentColor" /> Track location
        </a>
      ) : null}
    </div>
  );
}
