import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { Page } from '../components/shared/page';
import {
  Alert,
  Button,
  Card,
  FormField,
  Input,
  Select,
  Textarea,
} from '../components/ui';
import {
  deliveryLinksApi,
  formatMoney,
  type Draft,
  type PublicLink,
  type PublicSubmission,
} from '../features/delivery-links/api';
import {
  AddressSearch,
  type SelectedAddress,
} from '../components/shared/address-search';

export function Component() {
  const { code = '' } = useParams();
  const [link, setLink] = useState<PublicLink>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [checkout, setCheckout] = useState<{
    checkoutId: string;
    accountNumber: string;
    bankName: string;
    amount: number;
    currency: string;
    expiresAt: string;
  }>();
  const [done, setDone] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<SelectedAddress>();
  const [addressQuery, setAddressQuery] = useState('');
  const [review, setReview] = useState<{
    submissionRef: string;
    requiresPayment: boolean;
    order: Draft;
  }>();
  useEffect(() => {
    deliveryLinksApi
      .resolve(code)
      .then(setLink)
      .catch((value: unknown) =>
        setError(
          value instanceof Error
            ? value.message
            : 'This link is invalid or no longer active.',
        ),
      );
  }, [code]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAddress) {
      setError('Search for and select the address from the suggestions.');
      return;
    }
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(
      [
        'address',
        'city',
        'state',
        'landmark',
        'name',
        'phone',
        'deliveryType',
        'mobilityMethod',
        'scheduledAt',
        'category',
        'description',
        'quantity',
        'weightKg',
        'length',
        'width',
        'height',
        'handling',
      ].map((name) => [name, String(form.get(name) ?? '')]),
    );
    const input: PublicSubmission = {
      customerLocation: {
        address: String(values.address),
        city: String(values.city),
        state: String(values.state),
        country: 'Nigeria',
        landmark: String(values.landmark || '') || undefined,
        contact: { name: String(values.name), phone: String(values.phone) },
      },
      deliveryType: values.deliveryType as 'last_mile' | 'interstate',
      mobilityMethod: String(values.mobilityMethod),
      scheduledAt: values.scheduledAt
        ? new Date(String(values.scheduledAt)).toISOString()
        : undefined,
      parcel: {
        category: String(values.category),
        description: String(values.description || ''),
        quantity: Number(values.quantity),
        weightKg: Number(values.weightKg),
        dimensionsCm: {
          length: Number(values.length),
          width: Number(values.width),
          height: Number(values.height),
        },
        handling: String(values.handling),
        inspectionConsent: true,
      },
    };
    try {
      setReview(await deliveryLinksApi.submit(code, input));
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : 'Could not create this delivery draft.',
      );
    } finally {
      setBusy(false);
    }
  }
  async function confirmQuote() {
    if (!review) return;
    setBusy(true);
    setError('');
    try {
      await deliveryLinksApi.confirm(code, review.submissionRef);
      if (review.requiresPayment)
        setCheckout(
          await deliveryLinksApi.checkout(code, review.submissionRef),
        );
      else setDone(true);
      setReview(undefined);
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : 'Could not confirm this quote.',
      );
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!checkout || done) return;
    let attempts = 0;
    const timer = window.setInterval(async () => {
      attempts += 1;
      try {
        const status = await deliveryLinksApi.checkoutStatus(
          code,
          checkout.checkoutId,
        );
        if (status.paid) {
          setDone(true);
          window.clearInterval(timer);
        }
      } catch {
        /* bounded polling tolerates temporary provider errors */
      }
      if (attempts >= 40) window.clearInterval(timer);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [checkout, code, done]);
  return (
    <Page
      title={link?.business.name ?? 'Delivery link'}
      description={
        link
          ? `${link.business.category} · Secure PEPSA delivery request`
          : 'Secure PEPSA delivery request'
      }
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {done ? (
        <Alert tone="success">
          Your draft is ready. The business will review it and send it out. You
          do not need the PEPSA app.
        </Alert>
      ) : checkout ? (
        <Card>
          <h2 className="text-xl font-bold">Complete your payment</h2>
          <p className="mt-2 text-sm text-muted">
            Transfer the exact amount to this temporary account. This page
            confirms verified payment automatically.
          </p>
          <dl className="my-5 grid gap-3">
            <div>
              <dt className="text-sm text-muted">Bank</dt>
              <dd className="font-semibold">{checkout.bankName}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Account number</dt>
              <dd className="text-2xl font-black tracking-wider">
                {checkout.accountNumber}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Amount</dt>
              <dd className="font-semibold">
                {new Intl.NumberFormat('en-NG', {
                  style: 'currency',
                  currency: checkout.currency,
                }).format(checkout.amount)}
              </dd>
            </div>
          </dl>
          <Alert>Waiting for verified payment…</Alert>
        </Card>
      ) : review ? (
        <Card>
          <h2 className="text-xl font-bold">Review delivery quote</h2>
          <p className="mt-2 text-sm text-muted">
            Confirm the route and price before the draft becomes visible to the
            business.
          </p>
          <dl className="my-5 grid gap-3">
            <div>
              <dt className="text-sm text-muted">Route</dt>
              <dd className="font-semibold">
                {review.order.pickup.address} → {review.order.delivery.address}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Parcel</dt>
              <dd className="font-semibold">{review.order.parcel.category}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Delivery cost</dt>
              <dd className="text-2xl font-black">
                {formatMoney(review.order.amount)}
              </dd>
            </div>
          </dl>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setReview(undefined)}>
              Back
            </Button>
            <Button loading={busy} onClick={confirmQuote}>
              {review.requiresPayment ? 'Confirm and pay' : 'Confirm draft'}
            </Button>
          </div>
        </Card>
      ) : link ? (
        <Card>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
            <div className="sm:col-span-2">
              <h2 className="text-xl font-bold">
                {link.pickupSource === 'customer'
                  ? 'Pickup details'
                  : 'Delivery details'}
              </h2>
            </div>
            <FormField label="Full address" required>
              <AddressSearch
                name="address"
                required
                value={addressQuery}
                onChange={(value) => {
                  setAddressQuery(value);
                  setSelectedAddress(undefined);
                }}
                onSelect={(value) => {
                  setAddressQuery(value.formattedAddress);
                  setSelectedAddress(value);
                }}
              />
            </FormField>
            <FormField
              label={
                link.pickupSource === 'customer'
                  ? 'Sender name'
                  : 'Receiver name'
              }
              required
            >
              <Input name="name" required autoComplete="name" />
            </FormField>
            <FormField label="Phone number" required>
              <Input name="phone" required type="tel" autoComplete="tel" />
            </FormField>
            <FormField label="Landmark / bus stop">
              <Input name="landmark" />
            </FormField>
            <FormField label="City" required>
              <Input
                name="city"
                required
                defaultValue={selectedAddress?.city ?? ''}
                key={`city-${selectedAddress?.placeId ?? ''}`}
              />
            </FormField>
            <FormField label="State" required>
              <Input
                name="state"
                required
                defaultValue={selectedAddress?.state ?? ''}
                key={`state-${selectedAddress?.placeId ?? ''}`}
              />
            </FormField>
            <FormField label="Delivery type">
              <Select name="deliveryType">
                <option value="last_mile">Within city</option>
                <option value="interstate">Interstate</option>
              </Select>
            </FormField>
            <FormField label="Mobility method">
              <Select name="mobilityMethod">
                <option value="motorcycle">Motorcycle</option>
                <option value="car">Car</option>
                <option value="van">Van</option>
              </Select>
            </FormField>
            <FormField label="Parcel category">
              <Select name="category">
                <option value="Mail and small parcel">Parcel</option>
                <option value="Food and essentials">Food</option>
                <option value="documents">Document</option>
                <option value="Fragile">Fragile</option>
              </Select>
            </FormField>
            <FormField label="Quantity">
              <Input
                name="quantity"
                type="number"
                min="1"
                defaultValue="1"
                required
              />
            </FormField>
            <FormField label="Weight (kg)">
              <Input
                name="weightKg"
                type="number"
                min="0.1"
                step="0.1"
                required
              />
            </FormField>
            <FormField label="Handling">
              <Select name="handling">
                <option value="GENERAL">General</option>
                <option value="FRAGILE">Fragile</option>
              </Select>
            </FormField>
            <FormField label="Length (cm)">
              <Input name="length" type="number" min="1" required />
            </FormField>
            <FormField label="Width (cm)">
              <Input name="width" type="number" min="1" required />
            </FormField>
            <FormField label="Height (cm)">
              <Input name="height" type="number" min="1" required />
            </FormField>
            <FormField label="Schedule (optional)">
              <Input name="scheduledAt" type="datetime-local" />
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Parcel description">
                <Textarea name="description" />
              </FormField>
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" loading={busy}>
                Review delivery cost
              </Button>
            </div>
          </form>
        </Card>
      ) : !error ? (
        <Card>
          <p className="text-sm text-muted">Loading delivery link…</p>
        </Card>
      ) : null}
    </Page>
  );
}
