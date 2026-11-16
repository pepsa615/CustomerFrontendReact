import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Checkbox,
  DateInput,
  FormField,
  Input,
  PasswordInput,
  Select,
} from '../components/ui';
import { apiRequest } from '../api/client';
import { AuthCard } from '../features/identity/auth-card';
const maximumBirthDate = (() => {
  const value = new Date();
  value.setFullYear(value.getFullYear() - 18);
  return value.toISOString().slice(0, 10);
})();
export function Component() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest<{ registrationToken: string }>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({
            firstName: data.get('firstName'),
            lastName: data.get('lastName'),
            phone: data.get('phone'),
            email: data.get('email'),
            dob: data.get('dob'),
            gender: data.get('gender'),
            password: data.get('password'),
            termsAccepted: data.get('terms') === 'on',
            privacyAccepted: data.get('privacy') === 'on',
            indemnityAccepted: data.get('indemnity') === 'on',
          }),
        },
      );
      sessionStorage.setItem(
        'pepsa.registration-token',
        result.registrationToken,
      );
      navigate('/auth/verify-email');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }
  return (
    <AuthCard
      title="Create your account"
      description="Set up your secure PEPSA account. You must be at least 18 years old."
    >
      <form className="grid gap-4" onSubmit={submit}>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <FormField label="First name" required>
            <Input
              name="firstName"
              autoComplete="given-name"
              required
              minLength={2}
            />
          </FormField>
          <FormField label="Last name" required>
            <Input
              name="lastName"
              autoComplete="family-name"
              required
              minLength={2}
            />
          </FormField>
        </div>
        <FormField
          label="Phone number"
          hint="Use international format, for example +234…"
          required
        >
          <Input
            name="phone"
            type="tel"
            autoComplete="tel"
            pattern="\+?[0-9]{8,15}"
            required
          />
        </FormField>
        <FormField label="Email" required>
          <Input name="email" type="email" autoComplete="email" required />
        </FormField>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <FormField label="Date of birth" required>
            <DateInput name="dob" max={maximumBirthDate} required />
          </FormField>
          <FormField label="Gender" required>
            <Select name="gender" required defaultValue="">
              <option value="" disabled>
                Select
              </option>
              <option value="FEMALE">Female</option>
              <option value="MALE">Male</option>
            </Select>
          </FormField>
        </div>
        <FormField
          label="Password"
          hint="8+ characters with uppercase, lowercase, number and symbol"
          required
        >
          <PasswordInput
            name="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </FormField>
        <label className="flex gap-3 text-sm">
          <Checkbox name="terms" required />
          <span>I agree to the <Link className="font-semibold text-primary" to="/terms">Terms and Conditions</Link>.</span>
        </label>
        <label className="flex gap-3 text-sm">
          <Checkbox name="privacy" required />
          <span>I consent to the <Link className="font-semibold text-primary" to="/privacy">Privacy Policy</Link>.</span>
        </label>
        <label className="flex gap-3 text-sm">
          <Checkbox name="indemnity" required />
          <span>I agree to the <Link className="font-semibold text-primary" to="/indemnity">Indemnity Agreement</Link>.</span>
        </label>
        <Button type="submit" loading={loading}>
          Create account
        </Button>
        <p className="text-center text-sm text-muted">
          Already registered?{' '}
          <Link className="font-semibold text-primary" to="/auth/login">
            Log in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
