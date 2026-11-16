import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Package, Timer, Truck } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  FormField,
  Input,
  Select,
} from '../../components/ui';
import {
  formatMoney,
  orderApi,
  type Order,
  type QuickQuoteInput,
  type QuoteInput,
} from './api';
import { completeOrderIntent } from './order-intent';
import { OrderFlowHeader } from './components/order-flow-header';

const stepTitles = [
  'Where are we delivering?',
  'Your delivery estimate',
  'Pickup details',
  'Delivery details',
  'Item information',
  'Summary',
  'Pay',
];

const defaultParcel = {
  category: 'Mail and small parcel',
  description: '',
  weightKg: 1,
  dimensionsCm: { length: 2, width: 3, height: 2 },
  handling: 'GENERAL',
};

export function OrderCreateFlow({
  token,
  onClose,
  initialRoute,
}: {
  token: string;
  onClose: () => void;
  initialRoute?: Partial<QuickQuoteInput>;
}) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<Order>();
  const [pin, setPin] = useState('');
  const [insurance, setInsurance] = useState(false);
  const [quick, setQuick] = useState<QuickQuoteInput>({
    deliveryType: initialRoute?.deliveryType ?? 'last_mile',
    mobilityMethod: initialRoute?.mobilityMethod ?? 'motorcycle',
    pickup: {
      address: initialRoute?.pickup?.address ?? '',
      city: initialRoute?.pickup?.city ?? '',
      state: initialRoute?.pickup?.state ?? '',
      country: 'Nigeria',
      landmark: initialRoute?.pickup?.landmark,
    },
    delivery: {
      address: initialRoute?.delivery?.address ?? '',
      city: initialRoute?.delivery?.city ?? '',
      state: initialRoute?.delivery?.state ?? '',
      country: 'Nigeria',
      landmark: initialRoute?.delivery?.landmark,
    },
    parcel: { category: defaultParcel.category },
  });
  const [details, setDetails] = useState<QuoteInput>({
    deliveryType: quick.deliveryType,
    mobilityMethod: quick.mobilityMethod,
    pickup: {
      address: quick.pickup.address,
      city: quick.pickup.city,
      state: quick.pickup.state,
      country: 'Nigeria',
      contact: { name: '', phone: '' },
    },
    delivery: {
      address: quick.delivery.address,
      city: quick.delivery.city,
      state: quick.delivery.state,
      country: 'Nigeria',
      contact: { name: '', phone: '' },
    },
    parcel: { ...defaultParcel },
  });

  async function fetchQuote() {
    setBusy(true);
    setError('');
    try {
      const quoted = await orderApi.quickQuote(token, quick);
      setOrder(quoted);
      setDetails((d) => ({
        ...d,
        deliveryType: quick.deliveryType,
        mobilityMethod: quick.mobilityMethod,
        pickup: {
          ...d.pickup,
          address: quick.pickup.address,
          city: quick.pickup.city,
          state: quick.pickup.state,
        },
        delivery: {
          ...d.delivery,
          address: quick.delivery.address,
          city: quick.delivery.city,
          state: quick.delivery.state,
        },
        parcel: { ...d.parcel, category: quick.parcel?.category ?? d.parcel.category },
      }));
      completeOrderIntent();
      setStep(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not get a quote');
    } finally {
      setBusy(false);
    }
  }

  async function saveAndPay() {
    if (!order) return;
    setBusy(true);
    setError('');
    try {
      await orderApi.updateDetails(token, order.id, details);
      const paid = await orderApi.pay(token, order.id, pin, crypto.randomUUID());
      navigate(`/app/orders/${paid.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setBusy(false);
    }
  }

  const routeReady =
    quick.pickup.address.trim() &&
    quick.pickup.city.trim() &&
    quick.pickup.state.trim() &&
    quick.delivery.address.trim() &&
    quick.delivery.city.trim() &&
    quick.delivery.state.trim();

  const contactReady = (kind: 'pickup' | 'delivery') =>
    Boolean(
      details[kind].contact.name.trim() &&
        details[kind].contact.phone.trim() &&
        details[kind].address.trim(),
    );

  return (
    <div className="mx-auto w-full max-w-xl">
      <OrderFlowHeader
        title={stepTitles[step]}
        step={step}
        steps={stepTitles.length}
        onBack={
          step > 0
            ? () => setStep((s) => Math.max(0, s - 1))
            : undefined
        }
      />
      {error ? <Alert tone="danger">{error}</Alert> : null}

      {step === 0 ? (
        <Card className="grid gap-4">
          <p className="text-sm text-muted">
            Get a price from pickup and delivery locations — like quoting a
            shipment before you pack it.
          </p>
          <FormField label="Service">
            <Select
              value={quick.deliveryType}
              onChange={(e) =>
                setQuick({ ...quick, deliveryType: e.target.value })
              }
            >
              <option value="last_mile">Last-mile delivery</option>
              <option value="interstate">Interstate delivery</option>
            </Select>
          </FormField>
          <FormField label="Vehicle">
            <Select
              value={quick.mobilityMethod}
              onChange={(e) =>
                setQuick({ ...quick, mobilityMethod: e.target.value })
              }
            >
              <option value="motorcycle">Motorcycle</option>
              <option value="car">Car</option>
              <option value="van">Van</option>
            </Select>
          </FormField>
          <FormField label="Pickup address" required>
            <Input
              value={quick.pickup.address}
              onChange={(e) =>
                setQuick({
                  ...quick,
                  pickup: { ...quick.pickup, address: e.target.value },
                })
              }
              placeholder="Street or area"
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="City" required>
              <Input
                value={quick.pickup.city}
                onChange={(e) =>
                  setQuick({
                    ...quick,
                    pickup: { ...quick.pickup, city: e.target.value },
                  })
                }
              />
            </FormField>
            <FormField label="State" required>
              <Input
                value={quick.pickup.state}
                onChange={(e) =>
                  setQuick({
                    ...quick,
                    pickup: { ...quick.pickup, state: e.target.value },
                  })
                }
              />
            </FormField>
          </div>
          <FormField label="Delivery address" required>
            <Input
              value={quick.delivery.address}
              onChange={(e) =>
                setQuick({
                  ...quick,
                  delivery: { ...quick.delivery, address: e.target.value },
                })
              }
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="City" required>
              <Input
                value={quick.delivery.city}
                onChange={(e) =>
                  setQuick({
                    ...quick,
                    delivery: { ...quick.delivery, city: e.target.value },
                  })
                }
              />
            </FormField>
            <FormField label="State" required>
              <Input
                value={quick.delivery.state}
                onChange={(e) =>
                  setQuick({
                    ...quick,
                    delivery: { ...quick.delivery, state: e.target.value },
                  })
                }
              />
            </FormField>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={!routeReady}
              loading={busy}
              onClick={() => void fetchQuote()}
            >
              Get quote
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 1 && order ? (
        <Card className="grid gap-5 text-center">
          <p className="text-sm text-muted">Delivery fee</p>
          <p className="text-4xl font-bold text-primary">
            {formatMoney(order.amount)}
          </p>
          <div className="grid grid-cols-3 gap-3 text-left text-sm">
            <span className="flex items-center gap-2">
              <Truck size={18} className="text-primary" />
              {order.mobilityMethod}
            </span>
            <span className="flex items-center gap-2">
              <MapPin size={18} className="text-primary" />
              {order.distanceKm ?? '—'} km
            </span>
            <span className="flex items-center gap-2">
              <Timer size={18} className="text-primary" />
              {order.durationSeconds
                ? `${Math.ceil(order.durationSeconds / 60)} mins`
                : '—'}
            </span>
          </div>
          <p className="text-xs text-muted">
            Price is locked for 15 minutes. Add contacts and package details next.
          </p>
          <Button onClick={() => setStep(2)}>Continue</Button>
        </Card>
      ) : null}

      {step === 2 ? (
        <ContactStep
          kind="pickup"
          title="Pickup Details"
          details={details}
          setDetails={setDetails}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
          canNext={contactReady('pickup')}
        />
      ) : null}

      {step === 3 ? (
        <ContactStep
          kind="delivery"
          title="Delivery Details"
          details={details}
          setDetails={setDetails}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
          canNext={contactReady('delivery')}
        />
      ) : null}

      {step === 4 ? (
        <Card className="grid gap-4">
          <FormField label="Category">
            <Select
              value={details.parcel.category}
              onChange={(e) =>
                setDetails({
                  ...details,
                  parcel: { ...details.parcel, category: e.target.value },
                })
              }
            >
              <option value="Mail and small parcel">Mail and small parcel</option>
              <option value="Electronic and gadgets">Electronic and gadgets</option>
              <option value="Food and essentials">Food and essentials</option>
              <option value="Pharmaceutical item">Pharmaceutical item</option>
            </Select>
          </FormField>
          <FormField label="Weight (kg)">
            <Input
              inputMode="decimal"
              value={String(details.parcel.weightKg ?? 1)}
              onChange={(e) =>
                setDetails({
                  ...details,
                  parcel: {
                    ...details.parcel,
                    weightKg: Number(e.target.value) || 1,
                  },
                })
              }
            />
          </FormField>
          <FormField label="Dimension (L × W × H)">
            <Input
              value={`${details.parcel.dimensionsCm?.length ?? 2} x ${details.parcel.dimensionsCm?.width ?? 3} x ${details.parcel.dimensionsCm?.height ?? 2}`}
              onChange={(e) => {
                const [l, w, h] = e.target.value
                  .split(/x/i)
                  .map((v) => Number(v.trim()));
                if (l && w && h) {
                  setDetails({
                    ...details,
                    parcel: {
                      ...details.parcel,
                      dimensionsCm: { length: l, width: w, height: h },
                    },
                  });
                }
              }}
            />
          </FormField>
          <FormField label="Handling">
            <Select
              value={details.parcel.handling}
              onChange={(e) =>
                setDetails({
                  ...details,
                  parcel: { ...details.parcel, handling: e.target.value },
                })
              }
            >
              <option value="GENERAL">General</option>
              <option value="FRAGILE">Fragile</option>
            </Select>
          </FormField>
          <FormField label="Name (optional)">
            <Input
              value={details.parcel.description ?? ''}
              onChange={(e) =>
                setDetails({
                  ...details,
                  parcel: { ...details.parcel, description: e.target.value },
                })
              }
            />
          </FormField>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={insurance}
              onChange={(e) => setInsurance(e.target.checked)}
            />
            <span>
              I consent to third-party insurance for this order and accept that
              extra charges may apply.
            </span>
          </label>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(3)}>
              Back
            </Button>
            <Button onClick={() => setStep(5)}>Continue</Button>
          </div>
        </Card>
      ) : null}

      {step === 5 && order ? (
        <Card className="grid gap-4">
          <div className="flex items-center gap-2 text-primary">
            <Package size={20} />
            <span className="font-bold">Summary</span>
          </div>
          <RouteSummary order={order} details={details} />
          <p className="text-2xl font-bold text-primary">
            {formatMoney(order.amount)}
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(4)}>
              Back
            </Button>
            <Button onClick={() => setStep(6)}>Continue to pay</Button>
          </div>
        </Card>
      ) : null}

      {step === 6 && order ? (
        <Card className="grid gap-4">
          <RouteSummary order={order} details={details} compact />
          <p className="text-2xl font-bold text-primary">
            {formatMoney(order.amount)}
          </p>
          <FormField label="Transaction PIN" required>
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
            loading={busy}
            disabled={pin.length !== 4}
            onClick={() => void saveAndPay()}
          >
            Pay
          </Button>
          <Link className="text-center text-sm text-primary" to="/app/security/transaction">
            Set up your transaction PIN
          </Link>
        </Card>
      ) : null}
    </div>
  );
}

function ContactStep({
  kind,
  details,
  setDetails,
  onBack,
  onNext,
  canNext,
}: {
  kind: 'pickup' | 'delivery';
  title: string;
  details: QuoteInput;
  setDetails: (v: QuoteInput) => void;
  onBack: () => void;
  onNext: () => void;
  canNext: boolean;
}) {
  const place = details[kind];
  return (
    <Card className="grid gap-4">
      <FormField label="Full address">
        <Input
          value={place.address}
          onChange={(e) =>
            setDetails({
              ...details,
              [kind]: { ...place, address: e.target.value },
            })
          }
        />
      </FormField>
      <FormField label="Sender / receiver name" required>
        <Input
          value={place.contact.name}
          onChange={(e) =>
            setDetails({
              ...details,
              [kind]: {
                ...place,
                contact: { ...place.contact, name: e.target.value },
              },
            })
          }
        />
      </FormField>
      <FormField label="Phone number" required>
        <Input
          inputMode="tel"
          value={place.contact.phone}
          onChange={(e) =>
            setDetails({
              ...details,
              [kind]: {
                ...place,
                contact: { ...place.contact, phone: e.target.value },
              },
            })
          }
        />
      </FormField>
      <FormField label="Landmark / bus stop">
        <Input />
      </FormField>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button disabled={!canNext} onClick={onNext}>
          Submit
        </Button>
      </div>
    </Card>
  );
}

function RouteSummary({
  order,
  details,
  compact,
}: {
  order: Order;
  details: QuoteInput;
  compact?: boolean;
}) {
  return (
    <div className="grid gap-3 text-sm">
      <div className="border-l-2 border-primary pl-4">
        <p className="font-semibold">Pickup</p>
        <p className="text-muted">
          {details.pickup.address}, {details.pickup.city}
        </p>
        {!compact ? (
          <p className="text-muted">
            {details.pickup.contact.name} · {details.pickup.contact.phone}
          </p>
        ) : null}
      </div>
      <div className="border-l-2 border-success pl-4">
        <p className="font-semibold">Delivery</p>
        <p className="text-muted">
          {details.delivery.address}, {details.delivery.city}
        </p>
        {!compact ? (
          <p className="text-muted">
            {details.delivery.contact.name} · {details.delivery.contact.phone}
          </p>
        ) : null}
      </div>
      {!compact ? (
        <p>
          <b>Category:</b> {details.parcel.category}
        </p>
      ) : null}
      <p className="text-xs text-muted">
        Ref #{order.id} · {order.mobilityMethod} · {order.distanceKm ?? '—'} km
      </p>
    </div>
  );
}