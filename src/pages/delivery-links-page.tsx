import { Page } from '../components/shared/page';
import { LinksWorkspace } from '../features/delivery-links/links-workspace';
export function Component() {
  return (
    <Page
      title="Delivery links"
      description="Create secure links for customer delivery details."
    >
      <LinksWorkspace />
    </Page>
  );
}
