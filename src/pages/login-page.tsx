import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Fingerprint } from 'lucide-react';
import {
  Alert,
  Button,
  Checkbox,
  FormField,
  Input,
  PasswordInput,
} from '../components/ui';
import { useAuth } from '../contexts/auth-context';
import { ApiError } from '../api/client';
import { postAuthDestination } from '../features/orders/order-intent';

export function Component() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    try {
      await login(identifier, password, remember);
      navigate(postAuthDestination());
    } catch (cause) {
      const apiError = cause as ApiError;
      if (apiError.code === 'EMAIL_VERIFICATION_REQUIRED') {
        const token = (
          apiError.details as { registrationToken?: string } | undefined
        )?.registrationToken;
        if (token) sessionStorage.setItem('pepsa.registration-token', token);
        navigate('/auth/verify-email');
      } else setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }

  function tryBiometric() {
    if (window.PublicKeyCredential) {
      setInfo('Passkey sign-in is coming soon on web.');
      return;
    }
    setInfo('Biometric sign-in is not available in this browser.');
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-[1.625rem] font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
          Welcome Back
        </h1>
        <p className="mt-2 max-w-md text-base leading-6 text-muted">
          Please enter your Phone number or Email and Password below to login.
        </p>
      </header>
      <form className="grid gap-5" onSubmit={submit}>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {info ? <Alert tone="info">{info}</Alert> : null}
        <FormField label="Email or Phone-number" required>
          <Input
            autoComplete="username"
            placeholder="eg; johndoe@pepsa.co"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            required
          />
        </FormField>
        <FormField label="Password" required>
          <PasswordInput
            autoComplete="current-password"
            placeholder="********"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </FormField>
        <div className="flex items-center justify-between gap-4 text-sm">
          <label className="flex items-center gap-2 font-medium text-primary">
            <Checkbox
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            Remember me
          </label>
          <Link
            className="font-medium text-primary hover:underline"
            to="/auth/forgot-password"
          >
            Forgot password?
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" loading={loading} className="min-h-14 flex-1 rounded-2xl text-base">
            Login
          </Button>
          <button
            type="button"
            aria-label="Sign in with biometrics"
            onClick={tryBiometric}
            className="grid size-14 shrink-0 place-items-center rounded-full border border-border bg-surface text-primary shadow-xs transition hover:bg-primary-soft"
          >
            <Fingerprint size={24} aria-hidden />
          </button>
        </div>
        <div className="relative py-2 text-center text-sm text-muted">
          <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" aria-hidden />
          <span className="relative bg-surface px-3">Or sign up</span>
        </div>
        <p className="text-center text-sm text-foreground">
          Don&apos;t have an account?{' '}
          <Link className="font-semibold text-primary hover:underline" to="/auth/sign-up">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}