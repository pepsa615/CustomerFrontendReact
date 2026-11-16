import { useSearchParams } from 'react-router-dom';
import { Page } from '../components/shared/page';
import { WalletWorkspace } from '../features/wallet/wallet-workspace';
import { parseWalletAction } from '../features/wallet/wallet-types';

export function Component() {
  const [params] = useSearchParams();
  const inFlow = Boolean(parseWalletAction(params.get('action')));

  if (inFlow) {
    return (
      <main className="mx-auto w-full max-w-lg px-5 py-6 sm:py-8 lg:max-w-xl">
        <WalletWorkspace />
      </main>
    );
  }

  return (
    <Page
      title="Wallet"
      description="Fund, transfer and pay securely from one place."
    >
      <div className="mx-auto w-full max-w-2xl">
        <WalletWorkspace />
      </div>
    </Page>
  );
}