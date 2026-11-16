import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button } from '../components/ui';
import { apiRequest } from '../api/client';
import { useAuth, type IdentityUser } from '../contexts/auth-context';
import { AuthStepLayout } from '../features/identity/auth-step-layout';
import { SegmentedOtpInput } from '../features/identity/segmented-otp-input';
import { SuccessSheet } from '../features/identity/success-sheet';

export function Component() {
  const { session, setSession } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const token = session?.accessToken;
  const headers = { authorization: `Bearer ${token ?? ''}` };
  const primed = useRef(false);

  useEffect(() => {
    if (!session || !token || primed.current) return;
    if (session.user.phoneVerified) {
      navigate('/auth/setup/pin', { replace: true });
      return;
    }
    primed.current = true;
    void apiRequest('/account/phone', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ phone: session.user.phone }),
    }).catch(() => undefined);
  }, [navigate, session, token]);

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest<{ user: IdentityUser }>(
        '/account/phone/verify-otp',
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ code: code.replace(/\D/g, '').slice(0, 6) }),
        },
      );
      setSession({ ...session!, user: data.user });
      setSuccessOpen(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (!token) return;
    setError('');
    try {
      await apiRequest('/account/phone/resend-otp', { method: 'POST', headers });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not resend code');
    }
  }

  return (
    <>
      <AuthStepLayout
        backTo="/auth/verify-email"
        title="Verify your phone"
        description="We sent a 6 digit code to your phone number."
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
        </form>
      </AuthStepLayout>
      <SuccessSheet
        open={successOpen}
        title="OTP Verification successful"
        onContinue={() => navigate('/auth/setup/pin', { replace: true })}
      />
    </>
  );
}