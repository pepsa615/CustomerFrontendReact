import { Building2, Copy, Share2 } from 'lucide-react';
import type { WalletOverview } from '../api';
import { WalletFlowHeader } from '../components/wallet-flow-header';
import { Alert, Button } from '../../../components/ui';

export function WalletDepositView({
  wallet,
}: {
  wallet: WalletOverview;
}) {
  const funding = wallet.fundingAccount;
  const shareText = funding
    ? `${funding.accountName}\n${funding.bankName}\n${funding.accountNumber}`
    : '';

  return (
    <div>
      <WalletFlowHeader title="Fund Wallet" />
      <section className="rounded-2xl border bg-surface p-5 shadow-sm">
        <div className="flex gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
            <Building2 size={26} />
          </span>
          <div>
            <p className="text-lg font-bold text-primary">Deposit</p>
            <p className="text-sm text-muted">Add money via bank deposit</p>
          </div>
        </div>
        {funding ? (
          <div className="mt-6 grid gap-3">
            <div>
              <p className="text-lg font-bold">{funding.accountName}</p>
              <p className="text-sm text-muted">{funding.bankName}</p>
            </div>
            <p className="text-2xl font-bold tracking-tight">
              {funding.accountNumber}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                className="min-h-11 rounded-xl px-4 text-xs"
                onClick={() =>
                  void navigator.clipboard.writeText(funding.accountNumber)
                }
              >
                <Copy size={16} />
                Copy Number
              </Button>
              <Button
                className="min-h-11 rounded-xl px-4 text-xs"
                onClick={() =>
                  void navigator.share?.({
                    title: 'Fund wallet',
                    text: shareText,
                  })
                }
              >
                <Share2 size={16} />
                Share Details
              </Button>
            </div>
          </div>
        ) : (
          <Alert>
            Your funding account is still being provisioned. Check back shortly.
          </Alert>
        )}
      </section>
      <p className="mt-6 text-sm text-muted">
        Transfer from any Nigerian bank. Credits are confirmed automatically and
        appear in your history.
      </p>
    </div>
  );
}