import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Settings2 } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Input,
  Switch,
  Toast,
} from '../../components/ui';
import { useAuth } from '../../contexts/auth-context';
import {
  deliveryLinksApi,
  formatMoney,
  type DeliveryLink,
  type Draft,
} from './api';
import {
  BusinessProfileDialog,
  type BusinessProfileRecord,
} from './business-profile-dialog';
import { DeliveryLinkConfig } from './delivery-link-config';

export function LinksWorkspace() {
  const { session } = useAuth();
  const [links, setLinks] = useState<DeliveryLink[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [pickup, setPickup] = useState<'customer' | 'business'>('customer');
  const [payer, setPayer] = useState<'customer' | 'vendor'>('customer');
  const [profile, setProfile] = useState<BusinessProfileRecord>({});
  const [profileReady, setProfileReady] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [pin, setPin] = useState('');

  const loadLinks = useCallback(() => {
    if (!session) return;
    deliveryLinksApi
      .links(session.accessToken)
      .then(setLinks)
      .catch(() => setLinks([]));
    deliveryLinksApi
      .drafts(session.accessToken)
      .then(setDrafts)
      .catch(() => setDrafts([]));
  }, [session]);

  const loadProfile = useCallback(() => {
    if (!session) return;
    deliveryLinksApi
      .business(session.accessToken)
      .then((data) => {
        setProfile(data.business);
        setProfileReady(true);
        setLinks(data.links);
      })
      .catch(() => {
        setProfileReady(false);
        setProfileOpen(true);
      });
  }, [session]);

  useEffect(() => {
    loadProfile();
    loadLinks();
  }, [loadLinks, loadProfile]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selected = useMemo(
    () =>
      links.find(
        (link) => link.pickupSource === pickup && link.paymentBy === payer,
      ),
    [links, pickup, payer],
  );

  async function copy() {
    if (!selected) return;
    await navigator.clipboard.writeText(selected.url);
    setToast('Delivery link copied.');
  }

  async function share() {
    if (!selected) return;
    if (navigator.share) {
      await navigator.share({ title: 'Delivery link', url: selected.url });
    } else {
      await copy();
    }
  }

  async function sendOut(id: string) {
    if (!session || pin.length !== 4) {
      setToast('Enter your four-digit transaction PIN.');
      return;
    }
    try {
      await deliveryLinksApi.sendOut(session.accessToken, id, pin);
      setToast('Draft sent out successfully.');
      setPin('');
      loadLinks();
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Send-out failed');
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl lg:max-w-4xl">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <Link
            to="/app"
            className="grid size-11 place-items-center rounded-full border border-border bg-surface text-primary shadow-sm transition hover:bg-surface-muted"
            aria-label="Back to dashboard"
          >
            <ChevronLeft size={22} />
          </Link>
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">Delivery link</h1>
            <p className="mt-1 text-sm text-muted">
              Share secure links for customer pickup and pay-on-delivery.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="shrink-0 gap-2"
          onClick={() => setProfileOpen(true)}
        >
          <Settings2 size={16} />
          <span className="hidden sm:inline">Business profile</span>
        </Button>
      </header>

      {!profileReady ? (
        <div className="mb-6">
          <Alert title="Profile required">
            Set your business profile once. Your four public links stay stable
            after updates.
            <Button
              type="button"
              className="mt-3"
              onClick={() => setProfileOpen(true)}
            >
              Set your profile
            </Button>
          </Alert>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,.92fr)] lg:items-start">
        <DeliveryLinkConfig
          pickup={pickup}
          payer={payer}
          profileReady={profileReady}
          selected={selected}
          onPickupChange={setPickup}
          onPayerChange={setPayer}
          onCopy={copy}
          onShare={share}
        />

        <Card className="hidden p-5 lg:block">
          <LinksAdminPanel
            links={links}
            sessionToken={session?.accessToken}
            onChanged={loadLinks}
          />
        </Card>
      </div>

      <Card className="mt-6 p-5 lg:hidden">
        <LinksAdminPanel
          links={links}
          sessionToken={session?.accessToken}
          onChanged={loadLinks}
        />
      </Card>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold sm:text-xl">Draft orders</h2>
        {drafts.length ? (
          <div className="grid gap-4">
            {drafts.map((draft) => (
              <Card key={draft.id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold">Draft #{draft.id}</p>
                    <p className="text-sm text-muted">
                      {draft.pickup.address} → {draft.delivery.address}
                    </p>
                    <p className="mt-1 text-sm">
                      {draft.paymentStatus} · {formatMoney(draft.amount)}
                    </p>
                  </div>
                  <div className="flex w-full gap-2 sm:w-auto">
                    <Input
                      aria-label="Transaction PIN"
                      inputMode="numeric"
                      maxLength={4}
                      value={pin}
                      onChange={(event) =>
                        setPin(
                          event.target.value.replace(/\D/g, '').slice(0, 4),
                        )
                      }
                      className="h-11 w-full sm:w-28"
                    />
                    <Button
                      type="button"
                      className="shrink-0"
                      onClick={() => sendOut(draft.id)}
                    >
                      Send out
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No draft orders"
            description="Customer submissions appear here before you send them out."
          />
        )}
      </section>

      {session && profileOpen ? (
        <BusinessProfileDialog
          open={profileOpen}
          token={session.accessToken}
          exists={profileReady}
          profile={profile}
          onClose={() => setProfileOpen(false)}
          onSaved={(business) => {
            setProfile(business);
            setProfileReady(true);
            loadLinks();
            setToast('Business profile saved. Links are ready.');
          }}
        />
      ) : null}

      {toast ? <Toast message={toast} /> : null}
    </div>
  );
}

function LinksAdminPanel({
  links,
  sessionToken,
  onChanged,
}: {
  links: DeliveryLink[];
  sessionToken?: string;
  onChanged: () => void;
}) {
  return (
    <>
      <h2 className="font-bold">Your four links</h2>
      <p className="mt-1 text-sm text-muted">
        Toggle availability without changing the URL customers already have.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {links.map((link) => (
          <div
            key={link.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-muted/40 p-4"
          >
            <div className="text-sm">
              <p className="font-semibold">
                {link.pickupSource === 'customer'
                  ? 'Customer pickup'
                  : 'Business pickup'}
              </p>
              <p className="text-muted">
                {link.paymentBy === 'customer' ? 'Customer pays' : 'You pay'}
              </p>
            </div>
            <Switch
              checked={link.active}
              aria-label="Link active"
              onChange={async (event) => {
                if (!sessionToken) return;
                await deliveryLinksApi.setActive(
                  sessionToken,
                  link.token,
                  event.target.checked,
                );
                onChanged();
              }}
            />
          </div>
        ))}
      </div>
      <Link
        to="/app/business"
        className="mt-4 inline-flex text-sm font-semibold text-primary"
      >
        Settlement &amp; full business settings
      </Link>
    </>
  );
}
