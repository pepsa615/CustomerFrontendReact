import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Button } from '../components/ui';
import { apiRequest } from '../api/client';
import { useAuth, type IdentityUser } from '../contexts/auth-context';
import { AuthStepLayout } from '../features/identity/auth-step-layout';
import { SegmentedOtpInput } from '../features/identity/segmented-otp-input';
import { SuccessSheet } from '../features/identity/success-sheet';

export function Component() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const registrationToken =
    sessionStorage.getItem('pepsa.registration-token') ?? '';

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    const submittedCode = code.replace(/\D/g, '').slice(0, 6);
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest<{
        user: IdentityUser;
        accessToken: string;
      }>('/auth/register/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          registrationToken,
          code: submittedCode,
          sessionTransport: 'cookie',
          deviceName: navigator.userAgent.slice(0, 100),
          platform: 'web',
        }),
      });
      setSession({ user: data.user, accessToken: data.accessToken });
      sessionStorage.removeItem('pepsa.registration-token');
      setSuccessOpen(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    try {
      await apiRequest('/auth/register/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ registrationToken }),
      });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not resend code',
      );
    }
  }

  return (
    <>
      <AuthStepLayout
        backTo="/auth/sign-up"
        title="Verify your email address"
        description="We sent a 6 digit code to your email address"
      >
        <form className="grid gap-6" onSubmit={verify}>
          {error ? <Alert tone="danger">{error}</Alert> : null}
          <SegmentedOtpInput value={code} onChange={setCode} />
          <p className="text-sm text-muted">
            Didn&apos;t get code?{' '}
            <button
              type="button"
              className="font-semibold text-primary hover:underline"
              onClick={() => void resend()}
            >
              Resend
            </button>
          </p>
          <Button
            type="submit"
            loading={loading}
            disabled={code.length !== 6}
            className="min-h-14 rounded-2xl text-base"
          >
            Continue
          </Button>
          <p className="text-center text-sm text-muted">
            Wrong email?{' '}
            <Link className="font-semibold text-primary" to="/auth/sign-up">
              Start over
            </Link>
          </p>
        </form>
      </AuthStepLayout>
      <SuccessSheet
        open={successOpen}
        title="OTP Verification successful"
        onContinue={() => navigate('/auth/setup/phone', { replace: true })}
      />
    </>
  );
}