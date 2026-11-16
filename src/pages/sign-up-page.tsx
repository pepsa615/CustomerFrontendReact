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
import { AuthStepLayout } from '../features/identity/auth-step-layout';
import { normalizeNgPhone, PhoneField } from '../features/identity/phone-field';

const maximumBirthDate = (() => {
  const value = new Date();
  value.setFullYear(value.getFullYear() - 18);
  return value.toISOString().slice(0, 10);
})();

export function Component() {
  const navigate = useNavigate();
  const [phoneLocal, setPhoneLocal] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
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
            phone: normalizeNgPhone(phoneLocal),
            email: data.get('email'),
            dob: data.get('dob'),
            gender: data.get('gender'),
            password,
            termsAccepted: data.get('termsAccepted') === 'on',
            privacyAccepted: data.get('privacyAccepted') === 'on',
            indemnityAccepted: data.get('indemnityAccepted') === 'on',
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
    <AuthStepLayout
      title="Create your account"
      description="Create an account to get started."
    >
      <form className="grid gap-4" onSubmit={submit}>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <FormField label="First name" required>
            <Input
              name="firstName"
              placeholder="john"
              autoComplete="given-name"
              required
              minLength={2}
            />
          </FormField>
          <FormField label="Last name" required>
            <Input
              name="lastName"
              placeholder="doe"
              autoComplete="family-name"
              required
              minLength={2}
            />
          </FormField>
        </div>
        <FormField label="Phone number" required>
          <PhoneField value={phoneLocal} onChange={setPhoneLocal} required />
        </FormField>
        <FormField label="Email" required>
          <Input
            name="email"
            type="email"
            placeholder="eg; johndoe@gmail.com"
            autoComplete="email"
            required
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <FormField label="Gender" required>
            <Select name="gender" required defaultValue="">
              <option value="" disabled>
                Select
              </option>
              <option value="FEMALE">Female</option>
              <option value="MALE">Male</option>
            </Select>
          </FormField>
          <FormField label="Date of birth" required>
            <DateInput
              name="dob"
              placeholder="mm/dd/yy"
              max={maximumBirthDate}
              required
            />
          </FormField>
        </div>
        <FormField label="Referral code (optional)">
          <Input name="referral" placeholder="eg; john1236" />
        </FormField>
        <FormField label="Password" required>
          <PasswordInput
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </FormField>
        <FormField label="Confirm Password" required>
          <PasswordInput
            autoComplete="new-password"
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </FormField>
        <fieldset className="grid gap-3 rounded-2xl border p-4">
          <legend className="px-1 text-sm font-semibold">
            Required agreements
          </legend>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox name="termsAccepted" required />
            <span>
              I accept the{' '}
              <Link
                className="font-semibold text-primary underline"
                to="/terms"
                target="_blank"
              >
                Terms and Conditions
              </Link>
              .
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox name="privacyAccepted" required />
            <span>
              I accept the{' '}
              <Link
                className="font-semibold text-primary underline"
                to="/privacy"
                target="_blank"
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox name="indemnityAccepted" required />
            <span>
              I accept the{' '}
              <Link
                className="font-semibold text-primary underline"
                to="/indemnity"
                target="_blank"
              >
                Indemnity Agreement
              </Link>
              .
            </span>
          </label>
        </fieldset>
        <Button
          type="submit"
          loading={loading}
          className="min-h-14 rounded-2xl text-base"
        >
          Sign up
        </Button>
        <p className="text-center text-sm text-foreground">
          Already have an account?{' '}
          <Link className="font-semibold text-primary" to="/auth/login">
            Login
          </Link>
        </p>
      </form>
    </AuthStepLayout>
  );
}
