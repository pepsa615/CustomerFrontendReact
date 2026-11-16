import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, FormField, PasswordInput } from '../components/ui';
import { apiRequest } from '../api/client';
import { useAuth, type IdentityUser } from '../contexts/auth-context';
import { AuthStepLayout } from '../features/identity/auth-step-layout';
import {
  nextSetupPath,
  prefersNativeOnboarding,
} from '../features/identity/registration-flow';
import { useTransactionReadiness } from '../features/identity/use-transaction-readiness';

export function Component() {
  const { session, setSession } = useAuth();
  const navigate = useNavigate();
  const readiness = useTransactionReadiness(session?.accessToken);
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const token = session?.accessToken;

  useEffect(() => {
    if (!session?.user.phoneVerified) {
      navigate('/auth/setup/phone', { replace: true });
    }
  }, [navigate, session?.user.phoneVerified]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !session) return;
    if (pin !== confirm) {
      setError('PINs do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest<{ user: IdentityUser }>(
        '/account/transaction-pin',
        {
          method: 'POST',
          headers: { authorization: `Bearer ${token}` },
          body: JSON.stringify({ pin, confirmPin: confirm }),
        },
      );
      setSession({ ...session, user: data.user });
      const fresh = await readiness.refetch();
      const path =
        fresh.data && !fresh.data.kycComplete
          ? '/auth/setup/selfie'
          : nextSetupPath(data.user, fresh.data ?? {
              kycComplete: false,
              phoneVerified: true,
              pinSet: true,
              transactionReady: false,
            });
      navigate(path, { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save PIN');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthStepLayout
      backTo="/auth/setup/phone"
      title="Set your transaction pin"
      description="Create 4 digit transaction pin"
    >
      <form className="grid gap-5" onSubmit={submit}>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <FormField label="Transaction Pin">
          <PasswordInput
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            autoComplete="off"
            placeholder="****"
            value={pin}
            onChange={(event) =>
              setPin(event.target.value.replace(/\D/g, '').slice(0, 4))
            }
            required
          />
        </FormField>
        <FormField label="Confirm Transaction Pin">
          <PasswordInput
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            autoComplete="off"
            placeholder="****"
            value={confirm}
            onChange={(event) =>
              setConfirm(event.target.value.replace(/\D/g, '').slice(0, 4))
            }
            required
          />
        </FormField>
        <Button
          type="submit"
          loading={loading}
          disabled={pin.length !== 4 || confirm.length !== 4}
          className="min-h-14 rounded-2xl text-base"
        >
          Continue
        </Button>
        {!prefersNativeOnboarding() ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/app', { replace: true })}
          >
            Finish later
          </Button>
        ) : null}
      </form>
    </AuthStepLayout>
  );
}