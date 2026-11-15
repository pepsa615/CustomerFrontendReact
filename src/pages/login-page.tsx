import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Checkbox,
  FormField,
  Input,
  PasswordInput,
} from '../components/ui';
import { AuthCard } from '../features/identity/auth-card';
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
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
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
  return (
    <AuthCard
      title="Welcome back"
      description="Enter your phone number or email and password to continue."
    >
      <form className="grid gap-5" onSubmit={submit}>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <FormField label="Email or phone" required>
          <Input
            autoComplete="username"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            required
          />
        </FormField>
        <FormField label="Password" required>
          <PasswordInput
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </FormField>
        <div className="flex items-center justify-between gap-4 text-sm">
          <label className="flex items-center gap-2">
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
        <Button type="submit" loading={loading}>
          Log in
        </Button>
        <p className="text-center text-sm text-muted">
          Don’t have an account?{' '}
          <Link className="font-semibold text-primary" to="/auth/sign-up">
            Sign up
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
