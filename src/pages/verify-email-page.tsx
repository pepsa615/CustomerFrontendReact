import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, OtpInput } from '../components/ui';
import { apiRequest } from '../api/client';
import { AuthCard } from '../features/identity/auth-card';
import { useAuth, type IdentityUser } from '../contexts/auth-context';
export function Component() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const registrationToken =
    sessionStorage.getItem('pepsa.registration-token') ?? '';
  async function verify(event: React.FormEvent) {
    event.preventDefault();
    const submittedCode = String(
      new FormData(event.currentTarget as HTMLFormElement).get('code') ?? code,
    )
      .replace(/\D/g, '')
      .slice(0, 6);
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
      navigate('/app');
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
    <AuthCard
      title="Verify your email"
      description="Enter the six-digit code sent to your email. It expires in 10 minutes."
    >
      <form className="grid gap-5" onSubmit={verify}>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <OtpInput value={code} onChange={setCode} />
        <Button type="submit" loading={loading} disabled={code.length !== 6}>
          Verify and continue
        </Button>
        <Button type="button" variant="ghost" onClick={resend}>
          Resend code
        </Button>
      </form>
    </AuthCard>
  );
}
