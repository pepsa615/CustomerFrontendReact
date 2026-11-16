import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  FormField,
  Input,
  PasswordInput,
} from '../components/ui';
import { apiRequest } from '../api/client';
import { AuthStepLayout } from '../features/identity/auth-step-layout';
import { SegmentedOtpInput } from '../features/identity/segmented-otp-input';
import { SuccessSheet } from '../features/identity/success-sheet';

type Step = 'request' | 'verify' | 'reset';

export function Component() {
  const [step, setStep] = useState<Step>('request');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
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
        if (password !== confirm) throw new Error('Passwords do not match');
        await apiRequest('/auth/password-recovery/reset', {
          method: 'POST',
          body: JSON.stringify({ recoveryToken: token, password }),
        });
        setSuccessOpen(true);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not continue');
    } finally {
      setLoading(false);
    }
  }

  const titles = {
    request: 'Forgot Password',
    verify: '6 digit code',
    reset: 'Reset Password',
  } as const;

  const descriptions = {
    request:
      'Please enter your Email, we will send a code to your mail to reset password',
    verify: 'please check your email for a 6 digit code.',
    reset: undefined,
  } as const;

  return (
    <>
      <AuthStepLayout
        backTo={step === 'request' ? '/auth/login' : undefined}
        title={titles[step]}
        description={descriptions[step]}
      >
        <form className="grid gap-5" onSubmit={action}>
          {error ? <Alert tone="danger">{error}</Alert> : null}
          {step === 'request' ? (
            <FormField label="Email or Phone-number">
              <Input
                placeholder="eg; johndoe@pepsa.co"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                required
              />
            </FormField>
          ) : null}
          {step === 'verify' ? <SegmentedOtpInput value={code} onChange={setCode} /> : null}
          {step === 'reset' ? (
            <>
              <FormField label="New password">
                <PasswordInput
                  placeholder="enter new password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </FormField>
              <FormField label="Confirm New Password">
                <PasswordInput
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  required
                />
              </FormField>
            </>
          ) : null}
          {step === 'verify' ? (
            <p className="text-sm text-muted">
              Didn&apos;t get code?{' '}
              <button
                type="button"
                className="font-semibold text-primary hover:underline"
                onClick={() =>
                  void apiRequest('/auth/password-recovery/request', {
                    method: 'POST',
                    body: JSON.stringify({ identifier }),
                  })
                }
              >
                Resend
              </button>
            </p>
          ) : null}
          <Button
            type="submit"
            loading={loading}
            disabled={step === 'verify' && code.length !== 6}
            className="min-h-14 rounded-2xl text-base"
          >
            {step === 'reset' ? 'Save' : 'Continue'}
          </Button>
          <Link className="text-center text-sm text-primary" to="/auth/login">
            Back to login
          </Link>
        </form>
      </AuthStepLayout>
      <SuccessSheet
        open={successOpen}
        title="Password Successfully Saved"
        onContinue={() => navigate('/auth/login', { replace: true })}
      />
    </>
  );
}