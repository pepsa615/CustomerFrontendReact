import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  FormField,
  Input,
  OtpInput,
  PasswordInput,
} from '../components/ui';
import { Page } from '../components/shared/page';
import { apiRequest } from '../api/client';
import { useAuth } from '../contexts/auth-context';
export function Component() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'phone' | 'otp' | 'pin'>(
    session?.user.phoneVerified ? 'pin' : 'phone',
  );
  const [phone, setPhone] = useState(session?.user.phone ?? '');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const headers = { authorization: `Bearer ${session?.accessToken ?? ''}` };
  async function next(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    try {
      if (step === 'phone') {
        await apiRequest('/account/phone', {
          method: 'POST',
          headers,
          body: JSON.stringify({ phone }),
        });
        setStep('otp');
      } else if (step === 'otp') {
        await apiRequest('/account/phone/verify-otp', {
          method: 'POST',
          headers,
          body: JSON.stringify({ code }),
        });
        setStep('pin');
      } else {
        const data = new FormData(event.currentTarget);
        await apiRequest('/account/transaction-pin', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            pin: data.get('pin'),
            confirmPin: data.get('confirmPin'),
          }),
        });
        setMessage('Transaction setup complete.');
        window.setTimeout(() => navigate('/app/wallet'), 700);
      }
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Could not continue');
    }
  }
  return (
    <Page
      title="Transaction security"
      description="Verify your phone and create a four-digit PIN before making payments or transfers."
    >
      <form
        className="grid w-full max-w-lg gap-5 rounded-2xl border bg-surface p-5 sm:rounded-3xl sm:p-6"
        onSubmit={next}
      >
        {message ? (
          <Alert tone={message.includes('complete') ? 'success' : 'danger'}>
            {message}
          </Alert>
        ) : null}
        {step === 'phone' ? (
          <FormField label="Phone number">
            <Input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </FormField>
        ) : null}
        {step === 'otp' ? <OtpInput value={code} onChange={setCode} /> : null}
        {step === 'pin' ? (
          <>
            <FormField label="Four-digit PIN">
              <PasswordInput
                name="pin"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
              />
            </FormField>
            <FormField label="Confirm PIN">
              <PasswordInput
                name="confirmPin"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
              />
            </FormField>
          </>
        ) : null}
        <Button type="submit">Continue</Button>
      </form>
    </Page>
  );
}
