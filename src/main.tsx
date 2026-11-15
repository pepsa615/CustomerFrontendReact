import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import { AppProviders } from './app/providers';
import { router } from './app/router';
import './styles/index.css';
import { startTelemetry } from './telemetry';
import { captureOrderIntent } from './features/orders/order-intent';

startTelemetry();
captureOrderIntent(window.location.hash.slice(1) || window.location.search);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () =>
    navigator.serviceWorker.register('/sw.js'),
  );
}
