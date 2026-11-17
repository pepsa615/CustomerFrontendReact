import { useEffect, useState, type FormEvent } from 'react';
import {
  Alert,
  Button,
  Card,
  FormField,
  Input,
  Select,
} from '../../components/ui';
import { useAuth } from '../../contexts/auth-context';
import {
  deliveryLinksApi,
  formatMoney,
  type BusinessCategory,
  type Settlement,
} from './api';

export function BusinessWorkspace() {
  const { session } = useAuth();
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [settlement, setSettlement] = useState<Settlement>();
  const [exists, setExists] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    deliveryLinksApi.categories().then(setCategories);
    if (session) {
      deliveryLinksApi
        .business(session.accessToken)
        .then((data) => {
          setProfile(data.business);
          setExists(true);
        })
        .catch(() => undefined);
      deliveryLinksApi
        .settlement(session.accessToken)
        .then(setSettlement)
        .catch(() => undefined);
    }
  }, [session]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage('');
    try {
      const result = exists
        ? await deliveryLinksApi.updateBusiness(session.accessToken, form)
        : await deliveryLinksApi.saveBusiness(session.accessToken, form);
      setProfile(result.business);
      setExists(true);
      setEditing(false);
      setMessage(
        exists
          ? 'Business profile updated. Existing links were preserved.'
          : 'Business profile and delivery links are ready.',
      );
      setSettlement(await deliveryLinksApi.settlement(session.accessToken));
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not save business profile',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <Card>
        <h2 className="text-xl font-bold">Set your profile</h2>
        <p className="mt-1 text-sm text-muted">
          Required before you can share a delivery link.
        </p>
        {exists && !editing ? (
          <div className="grid gap-4">
            <Alert tone="success">
              Your business profile is active. Existing public links remain
              stable when profile details change.
            </Alert>
            <div>
              <Button variant="secondary" onClick={() => setEditing(true)}>
                Edit business profile
              </Button>
            </div>
          </div>
        ) : (
          <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={save}>
            <FormField label="Business category" required>
              <Select
                name="category"
                required
                defaultValue={String(profile.category ?? '')}
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
            <FormField
              label="Other category"
              hint="Required only when Other is selected"
            >
              <Input
                name="otherCategory"
                defaultValue={String(profile.otherCategory ?? '')}
              />
            </FormField>
            <FormField label="Business name" required>
              <Input
                name="businessName"
                required
                autoComplete="organization"
                defaultValue={String(profile.name ?? '')}
              />
            </FormField>
            <FormField label="Phone number" required>
              <Input
                name="phoneNumber"
                required
                type="tel"
                autoComplete="tel"
                defaultValue={String(profile.phoneNumber ?? '')}
              />
            </FormField>
            <FormField label="Business location" required>
              <Input
                name="address"
                required
                autoComplete="street-address"
                defaultValue={String(profile.address ?? '')}
              />
            </FormField>
            <FormField label="City" required>
              <Input
                name="city"
                required
                defaultValue={String(profile.city ?? '')}
              />
            </FormField>
            <FormField label="State" required>
              <Input
                name="state"
                required
                defaultValue={String(profile.state ?? '')}
              />
            </FormField>
            <FormField label="Building / floor">
              <Input
                name="houseAddress"
                defaultValue={String(profile.houseAddress ?? '')}
              />
            </FormField>
            <FormField label="Landmark">
              <Input
                name="landmark"
                defaultValue={String(profile.landmark ?? '')}
              />
            </FormField>
            <FormField label="Business logo" hint="JPG, PNG or WebP up to 2 MB">
              <Input
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
              />
            </FormField>
            <div className="sm:col-span-2 flex gap-3">
              <Button type="submit" loading={busy}>
                {exists ? 'Save changes' : 'Continue'}
              </Button>
              {exists ? (
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        )}
        {message ? (
          <p role="status" className="mt-4 text-sm">
            {message}
          </p>
        ) : null}
      </Card>
      <Card>
        <p className="text-sm text-muted">Settlement balance</p>
        <p className="mt-2 text-3xl font-black">
          {settlement ? formatMoney(settlement.balance) : '—'}
        </p>
        <p className="mt-1 text-sm text-muted">
          Status: {settlement?.status ?? 'Complete your profile'}
        </p>
        {settlement?.status === 'FAILED' && session ? (
          <div className="mt-3">
            <Button
              variant="secondary"
              onClick={async () => {
                setBusy(true);
                try {
                  await deliveryLinksApi.retrySettlement(session.accessToken);
                  setSettlement(
                    await deliveryLinksApi.settlement(session.accessToken),
                  );
                  setMessage('Settlement provisioning retried successfully.');
                } catch (error) {
                  setMessage(
                    error instanceof Error
                      ? error.message
                      : 'Settlement retry failed',
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              Retry settlement setup
            </Button>
          </div>
        ) : null}
        <h3 className="mt-6 font-semibold">Recent settlement activity</h3>
        <div className="mt-3 grid gap-3">
          {settlement?.entries.length ? (
            settlement.entries.slice(0, 8).map((entry) => (
              <div
                key={entry.id}
                className="flex justify-between gap-3 border-b pb-3 text-sm"
              >
                <span>{entry.description}</span>
                <strong
                  className={
                    entry.direction === 'DEBIT' ? 'text-danger' : 'text-success'
                  }
                >
                  {entry.direction === 'DEBIT' ? '−' : '+'}
                  {formatMoney({
                    currency: entry.currency,
                    minorUnits: entry.amountMinor,
                  })}
                </strong>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">No settlement movements yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
