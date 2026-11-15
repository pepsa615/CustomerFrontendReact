import { Page } from '../components/shared/page';
import { OrderWorkspace } from '../features/orders/order-workspace';
export function Component() {
  return (
    <Page title="Orders" description="Quote, place and track deliveries.">
      <OrderWorkspace />
    </Page>
  );
}
