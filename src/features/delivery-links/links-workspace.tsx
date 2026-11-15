import { useEffect, useMemo, useState } from 'react';
import { Copy, Link2, Send } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  FormField,
  Input,
  Select,
  Switch,
} from '../../components/ui';
import { useAuth } from '../../contexts/auth-context';
import {
  deliveryLinksApi,
  formatMoney,
  type DeliveryLink,
  type Draft,
} from './api';

export function LinksWorkspace() {
  const { session } = useAuth();
  const [links, setLinks] = useState<DeliveryLink[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [pickup, setPickup] = useState<'customer' | 'business'>('customer');
  const [payer, setPayer] = useState<'customer' | 'vendor'>('customer');
  const [notice, setNotice] = useState('');
  const [pin, setPin] = useState('');
  const load = () => {
    if (!session) return;
    deliveryLinksApi
      .links(session.accessToken)
      .then(setLinks)
      .catch(() =>
        setNotice('Complete your business profile before sharing links.'),
      );
    deliveryLinksApi
      .drafts(session.accessToken)
      .then(setDrafts)
      .catch(() => undefined);
  };
  useEffect(load, [session]);
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
    setNotice('Delivery link copied.');
  }
  async function share() {
    if (!selected) return;
    if (navigator.share)
      await navigator.share({ title: 'Delivery link', url: selected.url });
    else await copy();
  }
  async function sendOut(id: string) {
    if (!session || pin.length !== 4) {
      setNotice('Enter your four-digit transaction PIN.');
      return;
    }
    try {
      await deliveryLinksApi.sendOut(session.accessToken, id, pin);
      setNotice('Draft sent out successfully.');
      setPin('');
      load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Send-out failed');
    }
  }
  return (
    <div className="grid gap-6">
      {notice ? <Alert>{notice}</Alert> : null}
      <Card>
        <h2 className="text-xl font-bold">Share link with customer by need</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <FormField label="Pickup source">
            <Select
              value={pickup}
              onChange={(event) =>
                setPickup(event.target.value as typeof pickup)
              }
            >
              <option value="customer">Pickup from customer</option>
              <option value="business">From my business address</option>
            </Select>
          </FormField>
          <FormField label="Who is paying for delivery">
            <Select
              value={payer}
              onChange={(event) => setPayer(event.target.value as typeof payer)}
            >
              <option value="customer">Payment from customer</option>
              <option value="vendor">From my PEPSA wallet</option>
            </Select>
          </FormField>
        </div>
        <div className="mt-5 rounded-2xl border bg-primary-soft p-5">
          <div className="flex gap-3">
            <Link2 className="text-primary" />
            <div>
              <p className="font-semibold">
                {pickup === 'customer'
                  ? 'Customer sends the item'
                  : 'You send the item'}{' '}
                &amp;{' '}
                {payer === 'customer'
                  ? 'customer pays the cost'
                  : 'you pay the cost'}
              </p>
              <p className="mt-1 text-sm text-muted">
                The customer only enters their side of the route and parcel
                details.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={copy} disabled={!selected || !selected.active}>
            <Copy size={18} />
            Copy the link
          </Button>
          <Button
            variant="secondary"
            onClick={share}
            disabled={!selected || !selected.active}
          >
            <Send size={18} />
            Share
          </Button>
        </div>
      </Card>
      <Card>
        <h2 className="text-xl font-bold">Your four links</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {links.map((link) => (
            <div key={link.id} className="rounded-2xl border p-4">
              <p className="font-semibold">
                {link.pickupSource === 'customer'
                  ? 'Customer pickup'
                  : 'Business pickup'}{' '}
                · {link.paymentBy === 'customer' ? 'Customer pays' : 'You pay'}
              </p>
              <div className="mt-3">
                <Switch
                  checked={link.active}
                  aria-label="Link active"
                  onChange={async (event) => {
                    if (!session) return;
                    await deliveryLinksApi.setActive(
                      session.accessToken,
                      link.token,
                      event.target.checked,
                    );
                    load();
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
      <section>
        <h2 className="mb-4 text-xl font-bold">Draft orders</h2>
        {drafts.length ? (
          <div className="grid gap-4">
            {drafts.map((draft) => (
              <Card key={draft.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">Draft #{draft.id}</p>
                    <p className="text-sm text-muted">
                      {draft.pickup.address} → {draft.delivery.address}
                    </p>
                    <p className="mt-1 text-sm">
                      {draft.paymentStatus} · {formatMoney(draft.amount)}
                    </p>
                  </div>
                  <div className="flex gap-2">
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
                      className="w-28"
                    />
                    <Button onClick={() => sendOut(draft.id)}>Send out</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No draft orders"
            description="Customer submissions will appear here before send-out."
          />
        )}
      </section>
    </div>
  );
}
