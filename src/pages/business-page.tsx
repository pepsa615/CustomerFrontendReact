import { Page } from '../components/shared/page';
import { BusinessWorkspace } from '../features/delivery-links/business-workspace';
export function Component() {
  return (
    <Page
      title="Business"
      description="Manage public pickup details and settlement setup."
    >
      <BusinessWorkspace />
    </Page>
  );
}
