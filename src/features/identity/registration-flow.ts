import type { IdentityUser } from '../../contexts/auth-context';

export type TransactionReadiness = {
  kycComplete: boolean;
  phoneVerified: boolean;
  pinSet: boolean;
  transactionReady: boolean;
};

/** Touch-first narrow viewports follow the full mobile KYC path. */
export function prefersNativeOnboarding() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(pointer: coarse)').matches &&
    window.matchMedia('(max-width: 767px)').matches
  );
}

export function nextSetupPath(
  user: IdentityUser,
  readiness: TransactionReadiness,
) {
  if (!user.emailVerified) return '/auth/verify-email';
  if (!readiness.phoneVerified) return '/auth/setup/phone';
  if (!readiness.pinSet) return '/auth/setup/pin';
  if (!readiness.kycComplete) return '/auth/setup/selfie';
  return '/app';
}