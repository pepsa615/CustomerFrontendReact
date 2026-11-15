import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/app-layout';
import { AuthLayout } from '../layouts/auth-layout';
import { PublicLayout } from '../layouts/public-layout';
import { RouteError } from '../pages/route-error';
import { RequireAuth } from './require-auth';
import { hasOrderIntent } from '../features/orders/order-intent';

function EntryRoute() {
  return (
    <Navigate to={hasOrderIntent() ? '/app/orders' : '/auth/login'} replace />
  );
}

export const router = createBrowserRouter([
  { path: '/', element: <EntryRoute /> },
  {
    path: '/auth',
    element: <AuthLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="login" replace /> },
      { path: 'login', lazy: () => import('../pages/login-page') },
      { path: 'sign-up', lazy: () => import('../pages/sign-up-page') },
      {
        path: 'verify-email',
        lazy: () => import('../pages/verify-email-page'),
      },
      {
        path: 'forgot-password',
        lazy: () => import('../pages/password-recovery-page'),
      },
      { path: 'onboarding', lazy: () => import('../pages/onboarding-page') },
    ],
  },
  {
    path: '/app',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    errorElement: <RouteError />,
    children: [
      { index: true, lazy: () => import('../pages/dashboard-page') },
      { path: 'orders', lazy: () => import('../pages/orders-page') },
      { path: 'orders/:id', lazy: () => import('../pages/order-detail-page') },
      { path: 'wallet', lazy: () => import('../pages/wallet-page') },
      { path: 'business', lazy: () => import('../pages/business-page') },
      {
        path: 'delivery-links',
        lazy: () => import('../pages/delivery-links-page'),
      },
      {
        path: 'security/transaction',
        lazy: () => import('../pages/transaction-setup-page'),
      },
      {
        path: 'transaction-security',
        element: <Navigate to="/app/security/transaction" replace />,
      },
      { path: 'kyc', lazy: () => import('../pages/onboarding-page') },
      {
        path: 'security/sessions',
        lazy: () => import('../pages/sessions-page'),
      },
      { path: 'settings', lazy: () => import('../pages/settings-page') },
      {
        path: 'settings/:section',
        lazy: () => import('../pages/settings-page'),
      },
    ],
  },
  {
    element: <PublicLayout />,
    errorElement: <RouteError />,
    children: [
      {
        path: '/delivery/:code',
        lazy: () => import('../pages/public-delivery-page'),
      },
      {
        path: '/business/:businessSlug/:methodSlug/:paymentSlug',
        lazy: () => import('../pages/legacy-delivery-page'),
      },
    ],
  },
  { path: '*', lazy: () => import('../pages/not-found-page') },
]);
