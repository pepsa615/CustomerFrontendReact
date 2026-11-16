import { useEffect, useState, type FormEvent } from 'react';
import { MapPin, Store } from 'lucide-react';
import { Button, Dialog, FormField, Input, Select } from '../../components/ui';
import { deliveryLinksApi, type BusinessCategory } from './api';

export type BusinessProfileRecord = Record<string, unknown>;

const emptyForm = {
  category: '',
  otherCategory: '',
  businessName: '',
  phoneNumber: '',
  address: '',
  city: '',
  state: '',
  latitude: '',
  longitude: '',
  houseAddress: '',
  landmark: '',
};

function recordToForm(profile: BusinessProfileRecord) {
  return {
    ...emptyForm,
    category: String(profile.category ?? ''),
    otherCategory: String(profile.otherCategory ?? ''),
    businessName: String(profile.name ?? ''),
    phoneNumber: String(profile.phoneNumber ?? ''),
    address: String(profile.address ?? ''),
    city: String(profile.city ?? ''),
    state: String(profile.state ?? ''),
    latitude: String(profile.latitude ?? ''),
    longitude: String(profile.longitude ?? ''),
    houseAddress: String(profile.houseAddress ?? ''),
    landmark: String(profile.landmark ?? ''),
  };
}

function locationLabel(form: typeof emptyForm) {
  if (form.city && form.state) return `${form.city}, ${form.state}`;
  if (form.address) return form.address;
  return '';
}

export function BusinessProfileDialog({
  open,
  token,
  exists,
  profile,
  onClose,
  onSaved,
}: {
  open: boolean;
  token: string;
  exists: boolean;
  profile: BusinessProfileRecord;
  onClose: () => void;
  onSaved: (business: BusinessProfileRecord) => void;
}) {
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [form, setForm] = useState(() => recordToForm(profile));
  const [logo, setLogo] = useState<File>();
  const [moreOpen, setMoreOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    deliveryLinksApi
      .categories()
      .then(setCategories)
      .catch(() => undefined);
  }, []);

  const avatarUrl = logo
    ? URL.createObjectURL(logo)
    : String(profile.logoUrl ?? '') || undefined;

  useEffect(() => {
    if (!logo || !avatarUrl) return;
    return () => URL.revokeObjectURL(avatarUrl);
  }, [avatarUrl, logo]);

  function patch(values: Partial<typeof emptyForm>) {
    setForm((current) => ({ ...current, ...values }));
  }

  function needsMoreDetails() {
    return (
      !form.phoneNumber.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.latitude.trim() ||
      !form.longitude.trim()
    );
  }

  async function persist(event?: FormEvent) {
    event?.preventDefault();
    setError('');
    if (!form.category || !form.businessName.trim() || !form.address.trim()) {
      setError('Choose a category, business name, and location.');
      return;
    }
    if (form.category === 'OTHER' && !form.otherCategory.trim()) {
      setError('Describe your business category.');
      return;
    }
    if (needsMoreDetails()) {
      setMoreOpen(true);
      setError('Add phone, city, state, and map coordinates in more details.');
      return;
    }

    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value) body.set(key, value);
    });
    if (logo) body.set('image', logo);

    setBusy(true);
    try {
      const result = exists
        ? await deliveryLinksApi.updateBusiness(token, body)
        : await deliveryLinksApi.saveBusiness(token, body);
      onSaved(result.business);
      setMoreOpen(false);
      onClose();
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : 'Could not save business profile',
      );
    } finally {
      setBusy(false);
    }
  }

  function useCurrentLocation() {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        patch({
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
        });
        setError('');
      },
      () => setError('Location permission was not granted.'),
    );
  }

  return (
    <>
      <Dialog
        open={open && !moreOpen}
        title="Set your profile"
        panelClassName="sm:max-w-lg"
        onClose={onClose}
      >
        <div className="-mt-2 text-center">
          <div className="mx-auto -mt-14 mb-4 grid size-20 place-items-center overflow-hidden rounded-full border-4 border-surface bg-surface-muted shadow-md">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              <Store className="text-muted" size={32} />
            )}
          </div>
          <p className="text-sm text-muted">
            Set up your profile for seamless delivery and pay-on-delivery.
          </p>
        </div>
        <form className="mt-6 grid gap-4" onSubmit={persist}>
          <FormField label="Business category" required>
            <Select
              required
              value={form.category}
              className="h-12 rounded-xl"
              onChange={(event) => patch({ category: event.target.value })}
            >
              <option value="" disabled>
                Select
              </option>
              {categories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </FormField>
          {form.category === 'OTHER' ? (
            <FormField label="Describe category" required>
              <Input
                value={form.otherCategory}
                onChange={(event) =>
                  patch({ otherCategory: event.target.value })
                }
              />
            </FormField>
          ) : null}
          <FormField label="Business name" required>
            <Input
              value={form.businessName}
              autoComplete="organization"
              onChange={(event) => patch({ businessName: event.target.value })}
            />
          </FormField>
          <FormField label="Business location" required>
            <LocationField
              value={form.address}
              display={locationLabel(form)}
              onChange={(address) => patch({ address })}
            />
          </FormField>
          <button
            type="button"
            className="text-left text-sm font-semibold text-primary"
            onClick={() => setMoreOpen(true)}
          >
            Add more details
          </button>
          <FormField label="Upload business logo" hint="PNG/JPEG, max 2 MB">
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setLogo(file);
              }}
            />
          </FormField>
          {error ? (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" loading={busy} className="h-12 w-full">
            Continue
          </Button>
        </form>
      </Dialog>

      <Dialog
        open={open && moreOpen}
        title="More details"
        onClose={() => setMoreOpen(false)}
      >
        <form className="grid gap-4" onSubmit={persist}>
          <FormField label="Full address" required>
            <Input
              value={form.address}
              autoComplete="street-address"
              onChange={(event) => patch({ address: event.target.value })}
            />
          </FormField>
          <FormField label="Phone number" required>
            <Input
              type="tel"
              autoComplete="tel"
              value={form.phoneNumber}
              onChange={(event) => patch({ phoneNumber: event.target.value })}
            />
          </FormField>
          <FormField label="Landmark">
            <Input
              value={form.landmark}
              onChange={(event) => patch({ landmark: event.target.value })}
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="City" required>
              <Input
                value={form.city}
                onChange={(event) => patch({ city: event.target.value })}
              />
            </FormField>
            <FormField label="State" required>
              <Input
                value={form.state}
                onChange={(event) => patch({ state: event.target.value })}
              />
            </FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Latitude" required>
              <Input
                type="number"
                step="any"
                value={form.latitude}
                onChange={(event) => patch({ latitude: event.target.value })}
              />
            </FormField>
            <FormField label="Longitude" required>
              <Input
                type="number"
                step="any"
                value={form.longitude}
                onChange={(event) => patch({ longitude: event.target.value })}
              />
            </FormField>
          </div>
          <FormField label="Building / floor">
            <Input
              value={form.houseAddress}
              onChange={(event) => patch({ houseAddress: event.target.value })}
            />
          </FormField>
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={useCurrentLocation}
          >
            Use current location
          </Button>
          {error ? (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              className="h-11 flex-1"
              onClick={() => setMoreOpen(false)}
            >
              Back
            </Button>
            <Button type="submit" loading={busy} className="h-11 flex-1">
              Submit
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

function LocationField({
  value,
  display,
  onChange,
}: {
  value: string;
  display: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <MapPin
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary"
        size={18}
      />
      <Input
        className="h-12 rounded-xl pl-10"
        placeholder="City, area"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {display && display !== value ? (
        <p className="mt-1 text-xs text-muted">{display}</p>
      ) : null}
    </div>
  );
}
