import { useEffect, useMemo, useState } from 'react';
import {
  Bike,
  BusFront,
  Camera,
  Car,
  MapPin,
  Package,
  Timer,
  Truck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AddressSearch } from '../../components/shared/address-search';
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
import { OrderFlowHeader } from './components/order-flow-header';

const fallbackOptions: {
  categories: string[];
  handlingModes: string[];
  lastMileVehicles: string[];
  vehiclesByCategory?: Record<string, string[]>;
} = {
  categories: [
    'Food and essentials',
    'Pharmaceutical item',
    'Mail and small parcel',
    'Laundry and clothing',
    'Electronics and gadgets',
    'Large item and others',
  ],
  handlingModes: [
    'GENERAL',
    'FRAGILE',
    'PERISHABLE',
    'HAZARDOUS',
    'SENSITIVE',
    'OVERSIZE',
  ],
  lastMileVehicles: [
    'motorcycle',
    'bicycle',
    'tricycle',
    'car',
    'van',
    'truck',
    'large_truck',
  ],
};
const titles = [
  'Delivery Request',
  'Pickup Details',
  'Delivery Details',
  'Item Information',
  'Summary',
  'Pay',
];
const blankPlace = { address: '', city: '', state: '', country: 'Nigeria' };

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
  const [options, setOptions] = useState(fallbackOptions);
  const [selected, setSelected] = useState({
    pickup: Boolean(initialRoute?.pickup?.address),
    delivery: Boolean(initialRoute?.delivery?.address),
  });
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [terms, setTerms] = useState(false);
  const [returnOrder, setReturnOrder] = useState(false);
  const [photoName, setPhotoName] = useState('');
  const [pin, setPin] = useState('');
  const [quick, setQuick] = useState<QuickQuoteInput>({
    mobilityMethod: initialRoute?.mobilityMethod ?? 'motorcycle',
    pickup: { ...blankPlace, ...initialRoute?.pickup },
    delivery: { ...blankPlace, ...initialRoute?.delivery },
    parcel: {
      category: initialRoute?.parcel?.category ?? 'Mail and small parcel',
    },
    returnOrder: false,
    termsAccepted: true,
  });
  const [details, setDetails] = useState<QuoteInput>({
    deliveryType: 'last_mile',
    mobilityMethod: 'motorcycle',
    pickup: {
      ...quick.pickup,
      country: quick.pickup.country ?? 'Nigeria',
      contact: { name: '', phone: '' },
    },
    delivery: {
      ...quick.delivery,
      country: quick.delivery.country ?? 'Nigeria',
      contact: { name: '', phone: '' },
    },
    parcel: {
      category: quick.parcel.category,
      description: '',
      weightKg: 1,
      dimensionsCm: { length: 2, width: 3, height: 2 },
      handling: 'GENERAL',
      insuranceConsent: false,
    },
  });
  useEffect(() => {
    void orderApi
      .options(token)
      .then((nextOptions) => {
        setOptions(nextOptions);
        setQuick((current) => {
          const allowed = nextOptions.vehiclesByCategory?.[current.parcel.category];
          return allowed?.length && !allowed.includes(current.mobilityMethod ?? '')
            ? { ...current, mobilityMethod: allowed[0] }
            : current;
        });
      })
      .catch(() => undefined);
  }, [token]);
  const interstate = useMemo(
    () =>
      Boolean(
        quick.pickup.city &&
        quick.delivery.city &&
        quick.pickup.city.trim().toLowerCase() !==
          quick.delivery.city.trim().toLowerCase(),
      ),
    [quick.pickup.city, quick.delivery.city],
  );
  const routeReady =
    selected.pickup &&
    selected.delivery &&
    quick.pickup.address &&
    quick.delivery.address &&
    quick.parcel.category &&
    terms &&
    (!date || time) &&
    (interstate || quick.mobilityMethod);
  const chooseAddress = (
    kind: 'pickup' | 'delivery',
    address: {
      formattedAddress: string;
      city: string;
      state: string;
      country: string;
    },
  ) => {
    setSelected((current) => ({ ...current, [kind]: true }));
    setQuick((current) => ({
      ...current,
      [kind]: {
        ...current[kind],
        address: address.formattedAddress,
        city: address.city,
        state: address.state,
        country: address.country,
      },
    }));
  };
  async function getQuote() {
    setBusy(true);
    setError('');
    try {
      const payload: QuickQuoteInput = {
        ...quick,
        mobilityMethod: interstate ? undefined : quick.mobilityMethod,
        returnOrder,
        termsAccepted: true,
        scheduledAt:
          date && time ? new Date(`${date}T${time}`).toISOString() : undefined,
      };
      const quoted = await orderApi.quickQuote(token, payload);
      setOrder(quoted);
      setDetails((current) => ({
        ...current,
        deliveryType: quoted.deliveryType,
        mobilityMethod: quoted.mobilityMethod,
        pickup: { ...current.pickup, ...payload.pickup },
        delivery: { ...current.delivery, ...payload.delivery },
        parcel: { ...current.parcel, category: payload.parcel.category },
      }));
      setStep(1);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not get a quote',
      );
    } finally {
      setBusy(false);
    }
  }
  async function saveDetails() {
    if (!order) return;
    setBusy(true);
    setError('');
    try {
      const updated = await orderApi.updateDetails(token, order.id, {
        pickup: details.pickup,
        delivery: details.delivery,
        parcel: details.parcel,
        pickupLandmark: details.pickup.landmark,
        deliveryLandmark: details.delivery.landmark,
      });
      setOrder(updated);
      setStep(4);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not save item details',
      );
    } finally {
      setBusy(false);
    }
  }
  async function pay() {
    if (!order) return;
    setBusy(true);
    setError('');
    try {
      const paid = await orderApi.pay(
        token,
        order.id,
        pin,
        crypto.randomUUID(),
      );
      navigate(`/app/orders/${paid.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Payment failed');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto w-full max-w-[680px] pb-8">
      <OrderFlowHeader
        title={titles[step]}
        step={step}
        steps={titles.length}
        onBack={step ? () => setStep((value) => value - 1) : onClose}
      />
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {step === 0 ? (
        <Card className="grid gap-5 rounded-3xl border-0 p-0 shadow-none">
          <AddressField
            label="Pickup Location"
            kind="pickup"
            value={quick.pickup.address}
            onChange={(value) => {
              setSelected((s) => ({ ...s, pickup: false }));
              setQuick((q) => ({
                ...q,
                pickup: { ...q.pickup, address: value },
              }));
            }}
            onSelect={(address) => chooseAddress('pickup', address)}
          />
          <AddressField
            label="Delivery Location"
            kind="delivery"
            value={quick.delivery.address}
            onChange={(value) => {
              setSelected((s) => ({ ...s, delivery: false }));
              setQuick((q) => ({
                ...q,
                delivery: { ...q.delivery, address: value },
              }));
            }}
            onSelect={(address) => chooseAddress('delivery', address)}
          />
          <FormField label="Item Details" required>
            <Select
              value={quick.parcel.category}
              onChange={(e) => {
                const category = e.target.value;
                const allowed = options.vehiclesByCategory?.[category];
                setQuick({
                  ...quick,
                  parcel: { category },
                  mobilityMethod:
                    allowed?.length && !allowed.includes(quick.mobilityMethod ?? '')
                      ? allowed[0]
                      : quick.mobilityMethod,
                });
              }}
            >
              {options.categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </FormField>
          <label className="grid cursor-pointer place-items-center gap-2 rounded-2xl bg-red-50 px-4 py-8 text-center dark:bg-red-950/30">
            <span className="grid size-14 place-items-center rounded-full bg-red-100 text-primary dark:bg-red-900">
              <Camera />
            </span>
            <span>{photoName || 'Take a picture of the package'}</span>
            <input
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const photo = e.target.files?.[0];
                if (!photo) return;
                setBusy(true);
                void orderApi
                  .uploadMedia(token, photo)
                  .then(({ id }) => {
                    setPhotoName(photo.name);
                    setQuick((current) => ({
                      ...current,
                      packageImageAssetId: id,
                    }));
                  })
                  .catch((cause: unknown) =>
                    setError(
                      cause instanceof Error
                        ? cause.message
                        : 'Photo upload failed',
                    ),
                  )
                  .finally(() => setBusy(false));
              }}
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date">
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </FormField>
            <FormField label="Time">
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </FormField>
          </div>
          {interstate ? (
            <Alert>
              Interstate delivery detected. Vehicle selection is not required.
            </Alert>
          ) : (
            <VehiclePicker
              value={quick.mobilityMethod ?? ''}
              vehicles={
                options.vehiclesByCategory?.[quick.parcel.category] ??
                options.lastMileVehicles
              }
              onChange={(mobilityMethod) =>
                setQuick({ ...quick, mobilityMethod })
              }
            />
          )}
          <label className="grid gap-1">
            <span className="flex items-center gap-3 text-primary">
              <Checkbox
                checked={returnOrder}
                onChange={(e) => setReturnOrder(e.target.checked)}
              />{' '}
              Return order
            </span>
            <span className="pl-8 text-xs text-muted">
              Select this when the dispatcher must return to the pickup address
              after completing the delivery. BAS includes the return leg in the
              quote.
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-blue-700 dark:text-blue-300">
            <Checkbox
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
            />
            <span>
              I accept the Terms &amp; Conditions and confirm there are no
              prohibited items in the package.
            </span>
          </label>
          <Button
            className="h-14 text-lg"
            disabled={!routeReady}
            loading={busy}
            onClick={() => void getQuote()}
          >
            Continue
          </Button>
        </Card>
      ) : null}
      {step === 1 ? (
        <ContactScreen
          label="Pickup Details"
          nameLabel="Sender Name"
          place={details.pickup}
          onChange={(pickup) => setDetails({ ...details, pickup })}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
        />
      ) : null}
      {step === 2 ? (
        <ContactScreen
          label="Delivery Details"
          nameLabel="Receiver Name"
          place={details.delivery}
          onChange={(delivery) => setDetails({ ...details, delivery })}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      ) : null}
      {step === 3 ? (
        <Card className="grid gap-5 rounded-3xl">
          <FormField label="Name">
            <Input
              placeholder="Optional"
              value={details.parcel.description}
              onChange={(e) =>
                setDetails({
                  ...details,
                  parcel: { ...details.parcel, description: e.target.value },
                })
              }
            />
          </FormField>
          <FormField label="Weight (kg)" required>
            <Input
              inputMode="decimal"
              value={String(details.parcel.weightKg ?? '')}
              onChange={(e) =>
                setDetails({
                  ...details,
                  parcel: {
                    ...details.parcel,
                    weightKg: Number(e.target.value),
                  },
                })
              }
            />
          </FormField>
          <FormField label="Dimension (L × W × H)">
            <Input
              value={`${details.parcel.dimensionsCm?.length ?? 2} x ${details.parcel.dimensionsCm?.width ?? 3} x ${details.parcel.dimensionsCm?.height ?? 2}`}
              onChange={(e) => {
                const [length, width, height] = e.target.value
                  .split(/x/i)
                  .map(Number);
                if (length && width && height)
                  setDetails({
                    ...details,
                    parcel: {
                      ...details.parcel,
                      dimensionsCm: { length, width, height },
                    },
                  });
              }}
            />
          </FormField>
          <FormField label="Handling" required>
            <Select
              value={details.parcel.handling}
              onChange={(e) =>
                setDetails({
                  ...details,
                  parcel: { ...details.parcel, handling: e.target.value },
                })
              }
            >
              {options.handlingModes.map((mode) => (
                <option key={mode}>{mode}</option>
              ))}
            </Select>
          </FormField>
          <label className="flex items-start gap-3">
            <Checkbox
              checked={details.parcel.insuranceConsent}
              onChange={(e) =>
                setDetails({
                  ...details,
                  parcel: {
                    ...details.parcel,
                    insuranceConsent: e.target.checked,
                  },
                })
              }
            />{' '}
            I consent to third-party insurance for this order and accept that
            extra charges may apply.
          </label>
          <ActionRow
            back={() => setStep(2)}
            next={() => void saveDetails()}
            loading={busy}
          />
        </Card>
      ) : null}
      {step === 4 && order ? (
        <Summary
          order={order}
          details={details}
          onBack={() => setStep(3)}
          onSubmit={() =>
            order.orderKind === 'LARGE_COURIER'
              ? navigate('/app/orders')
              : setStep(5)
          }
        />
      ) : null}
      {step === 5 && order ? (
        <Card className="grid gap-5 rounded-3xl text-center">
          <p className="text-sm text-muted">Delivery Fee</p>
          <p className="text-4xl font-bold text-primary">
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
            className="h-14"
            disabled={pin.length !== 4}
            loading={busy}
            onClick={() => void pay()}
          >
            Pay
          </Button>
        </Card>
      ) : null}
    </div>
  );
}
function AddressField({
  label,
  kind,
  value,
  onChange,
  onSelect,
}: {
  label: string;
  kind: 'pickup' | 'delivery';
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: {
    formattedAddress: string;
    city: string;
    state: string;
    country: string;
  }) => void;
}) {
  return (
    <FormField label={label} required>
      <div className="relative">
        <MapPin
          className={`absolute left-4 top-1/2 z-10 -translate-y-1/2 ${kind === 'pickup' ? 'text-primary' : 'text-success'}`}
          size={20}
        />
        <AddressSearch
          value={value}
          onChange={onChange}
          onSelect={onSelect}
          placeholder="Search Google address"
        />
      </div>
    </FormField>
  );
}
function VehiclePicker({
  value,
  vehicles,
  onChange,
}: {
  value: string;
  vehicles: string[];
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-3 text-lg font-semibold">Vehicle Type</legend>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {vehicles.map((vehicle) => {
          const Icon =
            vehicle === 'motorcycle' || vehicle === 'bicycle'
              ? Bike
              : vehicle === 'tricycle'
                ? BusFront
                : vehicle === 'car'
                  ? Car
                  : Truck;
          return (
            <button
              type="button"
              key={vehicle}
              aria-pressed={value === vehicle}
              onClick={() => onChange(vehicle)}
              className={`grid min-h-28 place-items-center rounded-xl border text-sm capitalize ${value === vehicle ? 'border-primary bg-primary text-white' : 'border-transparent bg-red-50 text-primary dark:bg-red-950/30'}`}
            >
              <Icon aria-hidden />
              <span>{vehicle.replaceAll('_', ' ')}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
function ContactScreen({
  label,
  nameLabel,
  place,
  onChange,
  onBack,
  onNext,
}: {
  label: string;
  nameLabel: string;
  place: QuoteInput['pickup'];
  onChange: (place: QuoteInput['pickup']) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const ready = place.contact.name.trim() && place.contact.phone.trim();
  return (
    <Card className="grid gap-5 rounded-3xl">
      <h2 className="text-xl font-bold">{label}</h2>
      <FormField label="Full Address">
        <Input value={place.address} readOnly />
      </FormField>
      <FormField label={nameLabel} required>
        <Input
          value={place.contact.name}
          onChange={(e) =>
            onChange({
              ...place,
              contact: { ...place.contact, name: e.target.value },
            })
          }
        />
      </FormField>
      <FormField label="Phone Number" required>
        <Input
          inputMode="tel"
          value={place.contact.phone}
          onChange={(e) =>
            onChange({
              ...place,
              contact: { ...place.contact, phone: e.target.value },
            })
          }
        />
      </FormField>
      <FormField label="Landmark/Bus stop">
        <Input
          value={place.landmark ?? ''}
          onChange={(e) => onChange({ ...place, landmark: e.target.value })}
        />
      </FormField>
      <ActionRow back={onBack} next={onNext} disabled={!ready} />
    </Card>
  );
}
function ActionRow({
  back,
  next,
  disabled,
  loading,
}: {
  back: () => void;
  next: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 pt-3">
      <Button variant="secondary" className="h-14" onClick={back}>
        Back
      </Button>
      <Button
        className="h-14"
        disabled={disabled}
        loading={loading}
        onClick={next}
      >
        Submit
      </Button>
    </div>
  );
}
function Summary({
  order,
  details,
  onBack,
  onSubmit,
}: {
  order: Order;
  details: QuoteInput;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const large = order.orderKind === 'LARGE_COURIER';
  return (
    <Card className="grid gap-5 rounded-3xl">
      <h2 className="text-2xl font-bold">Summary</h2>
      <div className="border-l-2 border-primary pl-5">
        <b>Pickup Address</b>
        <p>{details.pickup.address}</p>
        <p className="text-sm text-muted">{details.pickup.landmark}</p>
      </div>
      <div className="border-l-2 border-success pl-5">
        <b>Delivery Address</b>
        <p>{details.delivery.address}</p>
        <p className="text-sm text-muted">{details.delivery.landmark}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <span>
          <Package className="mr-2 inline" size={17} />
          {order.deliveryType === 'last_mile'
            ? 'Last-mile Delivery'
            : 'Interstate Delivery'}
        </span>
        {order.mobilityMethod ? (
          <span>
            <Truck className="mr-2 inline" size={17} />
            {order.mobilityMethod}
          </span>
        ) : null}
        <span>
          <MapPin className="mr-2 inline" size={17} />
          {order.distanceKm ?? '—'} km
        </span>
        <span>
          <Timer className="mr-2 inline" size={17} />
          {order.durationSeconds
            ? `${Math.ceil(order.durationSeconds / 60)} mins`
            : '—'}
        </span>
        <span>{details.parcel.category}</span>
      </div>
      <div>
        <b>Sender Details</b>
        <p>
          {details.pickup.contact.name} · {details.pickup.contact.phone}
        </p>
      </div>
      <div>
        <b>Receiver Details</b>
        <p>
          {details.delivery.contact.name} · {details.delivery.contact.phone}
        </p>
      </div>
      {large ? (
        <Alert>
          This parcel is above 100 kg. It has been saved as a Large Courier
          draft for manual PEPSA follow-up; no payment or dispatch will occur
          now.
        </Alert>
      ) : (
        <div className="flex justify-between text-lg">
          <b>Delivery Fee</b>
          <b className="text-primary">{formatMoney(order.amount)}</b>
        </div>
      )}
      <ActionRow back={onBack} next={onSubmit} />
    </Card>
  );
}
