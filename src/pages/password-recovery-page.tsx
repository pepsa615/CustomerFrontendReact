import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  FormField,
  Input,
  OtpInput,
  PasswordInput,
} from '../components/ui';
import { apiRequest } from '../api/client';
import { AuthCard } from '../features/identity/auth-card';
type Step = 'request' | 'verify' | 'reset';
export function Component() {
  const [step, setStep] = useState<Step>('request');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  async function action(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (step === 'request') {
        await apiRequest('/auth/password-recovery/request', {
          method: 'POST',
          body: JSON.stringify({ identifier }),
        });
        setStep('verify');
      } else if (step === 'verify') {
        const data = await apiRequest<{ recoveryToken: string }>(
          '/auth/password-recovery/verify',
          { method: 'POST', body: JSON.stringify({ identifier, code }) },
        );
        setToken(data.recoveryToken);
        setStep('reset');
      } else {
        const data = new FormData(event.currentTarget);
        const password = String(data.get('password'));
        if (password !== data.get('confirmPassword'))
          throw new Error('Passwords do not match');
        await apiRequest('/auth/password-recovery/reset', {
          method: 'POST',
          body: JSON.stringify({ recoveryToken: token, password }),
        });
        navigate('/auth/login', { replace: true });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not continue');
    } finally {
      setLoading(false);
    }
  }
  return (
    <AuthCard
      title={
        step === 'request'
          ? 'Forgot password'
          : step === 'verify'
            ? 'Check your email'
            : 'Create a new password'
      }
      description={
        step === 'request'
          ? 'Enter your email or phone number. We’ll send a code if an account exists.'
          : step === 'verify'
            ? 'Enter the six-digit recovery code.'
            : 'Your new password will sign out every other device.'
      }
    >
      <form className="grid gap-5" onSubmit={action}>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {step === 'request' ? (
          <FormField label="Email or phone">
            <Input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
            />
          </FormField>
        ) : null}
        {step === 'verify' ? (
          <OtpInput value={code} onChange={setCode} />
        ) : null}
        {step === 'reset' ? (
          <>
            <FormField
              label="New password"
              hint="8+ characters with uppercase, lowercase, number and symbol"
            >
              <PasswordInput
                name="password"
                autoComplete="new-password"
                required
              />
            </FormField>
            <FormField label="Confirm password">
              <PasswordInput
                name="confirmPassword"
                autoComplete="new-password"
                required
              />
            </FormField>
          </>
        ) : null}
        <Button type="submit" loading={loading}>
          {step === 'reset' ? 'Reset password' : 'Continue'}
        </Button>
        <Link className="text-center text-sm text-primary" to="/auth/login">
          Back to login
        </Link>
      </form>
    </AuthCard>
  );
}
