import { Copy, Link2, Share2 } from 'lucide-react';
import { Button, Card, FormField, Select } from '../../components/ui';
import type { DeliveryLink } from './api';

export type PickupSource = 'customer' | 'business';
export type DeliveryPayer = 'customer' | 'vendor';

function summaryTitle(pickup: PickupSource, payer: DeliveryPayer) {
  const sends =
    pickup === 'customer' ? 'Customer sends the item' : 'You send the item';
  const pays =
    payer === 'customer' ? 'customer pays the cost' : 'you pay the cost';
  return `${sends} & ${pays}`;
}

function summaryBody(pickup: PickupSource, payer: DeliveryPayer) {
  if (pickup === 'customer' && payer === 'customer') {
    return 'With this link, your customer schedules pickup time and location, then they pay the charges easily.';
  }
  if (pickup === 'customer' && payer === 'vendor') {
    return 'Your customer schedules pickup and enters parcel details. Delivery is paid from your PEPSA wallet.';
  }
  if (pickup === 'business' && payer === 'customer') {
    return 'Customers request pickup from your business address and pay delivery themselves.';
  }
  return 'Customers request pickup from your business address. You pay delivery from your PEPSA wallet.';
}

export function DeliveryLinkConfig({
  pickup,
  payer,
  onPickupChange,
  onPayerChange,
  selected,
  profileReady,
  onCopy,
  onShare,
}: {
  pickup: PickupSource;
  payer: DeliveryPayer;
  onPickupChange: (value: PickupSource) => void;
  onPayerChange: (value: DeliveryPayer) => void;
  selected?: DeliveryLink;
  profileReady: boolean;
  onCopy: () => void;
  onShare: () => void;
}) {
  const active = Boolean(selected?.active && profileReady);

  return (
    <Card className="relative overflow-hidden border-border/80 p-5 shadow-sm sm:p-6 lg:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 top-24 size-40 rounded-3xl border border-primary/10 bg-primary/5 opacity-60 md:size-52"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-2 top-36 size-28 rounded-2xl border border-primary/10 bg-primary/5 opacity-40 md:size-36"
      />
      <p className="text-sm font-medium text-muted">
        Share link with customer by need?
      </p>
      <div className="mt-6 grid gap-5 md:grid-cols-2 md:gap-6">
        <FormField label="Pickup source">
          <Select
            value={pickup}
            className="h-12 rounded-xl"
            onChange={(event) =>
              onPickupChange(event.target.value as PickupSource)
            }
          >
            <option value="" disabled>
              Select
            </option>
            <option value="customer">Pickup from customer</option>
            <option value="business">From my business address</option>
          </Select>
        </FormField>
        <FormField label="Who is paying for delivery">
          <Select
            value={payer}
            className="h-12 rounded-xl"
            onChange={(event) =>
              onPayerChange(event.target.value as DeliveryPayer)
            }
          >
            <option value="" disabled>
              Select
            </option>
            <option value="customer">Payment from customer</option>
            <option value="vendor">Paying from my Pepsa wallet</option>
          </Select>
        </FormField>
      </div>
      <div className="mt-6 border-b border-border pb-6">
        <div className="flex gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Link2 size={20} />
          </div>
          <div className="min-w-0">
            <p className="font-bold leading-snug">{summaryTitle(pickup, payer)}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {summaryBody(pickup, payer)}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-4">
        <Button
          type="button"
          className="h-12 w-full gap-2 text-base"
          disabled={!active}
          onClick={onCopy}
        >
          <Copy size={18} />
          Copy the link
        </Button>
        <button
          type="button"
          className="mx-auto flex items-center gap-2 text-sm font-semibold text-muted transition hover:text-foreground disabled:opacity-40"
          disabled={!active}
          onClick={onShare}
        >
          Share the link
          <Share2 size={16} className="text-primary" />
        </button>
        {!profileReady ? (
          <p className="text-center text-xs text-muted">
            Complete your business profile to activate links.
          </p>
        ) : null}
      </div>
    </Card>
  );
}