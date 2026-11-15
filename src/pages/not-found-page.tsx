import { Link } from 'react-router-dom';
import { Page } from '../components/shared/page';
export function Component() {
  return (
    <Page title="Page not found">
      <p className="text-muted">
        The page does not exist.{' '}
        <Link className="font-semibold text-primary underline" to="/">
          Return to PEPSA
        </Link>
        .
      </p>
    </Page>
  );
}
