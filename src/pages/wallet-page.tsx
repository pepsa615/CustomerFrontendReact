import { Page } from '../components/shared/page';
import { WalletWorkspace } from '../features/wallet/wallet-workspace';
export function Component() {
  return (
    <Page
      title="Wallet"
      description="Fund, transfer and pay securely from one place."
    >
      <WalletWorkspace />
    </Page>
  );
}
