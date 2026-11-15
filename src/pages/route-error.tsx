import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { ErrorState } from '../components/ui';
export function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? error.statusText
    : error instanceof Error
      ? error.message
      : 'Unexpected route error';
  return (
    <main className="mx-auto max-w-xl p-6">
      <ErrorState message={message} />
    </main>
  );
}
