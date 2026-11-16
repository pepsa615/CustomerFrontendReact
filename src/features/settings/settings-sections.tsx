import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  BookOpen,
  Fingerprint,
  Headphones,
  KeyRound,
  LockKeyhole,
  ShieldAlert,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-context';
import { useTheme } from '../../contexts/theme-context';
import { env } from '../../schemas/env';
import {
  Alert,
  Button,
  Card,
  Dialog,
  FormField,
  Input,
  PasswordInput,
  Select,
} from '../../components/ui';
import { settingsApi, type AccountProfile } from './api';
import { SegmentedOtp } from './segmented-otp';
import { SettingsMenuRow } from './settings-menu';
import { SuccessDialog } from './success-dialog';

export function useSettingsMessage() {
  const [message, setMessage] = useState('');
  return {
    message,
    setMessage,
    notice: message ? <Alert>{message}</Alert> : null,
  };
}

export function PersonalSection({
  token,
  profile,
  setProfile,
  loading,
}: {
  token: string;
  profile: AccountProfile | null;
  loading: boolean;
  setProfile: (p: AccountProfile) => void;
}) {
  const [editing, setEditing] = useState(false);
  const { notice, setMessage } = useSettingsMessage();

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = String(new FormData(e.currentTarget).get('fullName'));
    try {
      setProfile(await settingsApi.updateProfile(token, name));
      setEditing(false);
      setMessage('Personal information updated.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Update failed');
    }
  }

  async function copyAccount() {
    if (!profile?.accountNumber) return;
    await navigator.clipboard.writeText(profile.accountNumber);
    setMessage('Account number copied.');
  }

  if (loading) return <Card>Loading personal information…</Card>;

  return (
    <Card className="max-w-2xl">
      <div className="flex items-center justify-between gap-3 border-b pb-4">
        <h2 className="font-bold">Personal information</h2>
        {!editing ? (
          <Button type="button" variant="ghost" className="text-primary" onClick={() => setEditing(true)}>
            Edit
          </Button>
        ) : null}
      </div>
      {notice}
      <div className="mt-2">
        {editing ? (
          <form className="grid gap-4 py-2" onSubmit={submit}>
            <FormField label="Full name">
              <Input name="fullName" defaultValue={profile?.fullName} required />
            </FormField>
            <div className="flex gap-3">
              <Button type="submit">Save</Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : null}
        <DataRow
          label="Pepsa account number"
          value={profile?.accountNumber}
          action={
            profile?.accountNumber ? (
              <Button type="button" variant="ghost" className="h-8 px-2 text-xs" onClick={copyAccount}>
                Copy
              </Button>
            ) : null
          }
        />
        <DataRow label="Full name" value={profile?.fullName} />
        <DataRow label="Mobile number" value={profile?.phone} />
        <DataRow label="Gender" value={profile?.gender} />
        <DataRow
          label="Date of birth"
          value={profile ? new Date(profile.dob).toLocaleDateString() : undefined}
        />
        <DataRow label="Email" value={profile?.email} />
        <DataRow label="NIN" value={profile?.maskedNin ?? 'Not provided'} />
      </div>
    </Card>
  );
}

function DataRow({
  label,
  value,
  action,
}: {
  label: string;
  value?: string | null;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/70 py-3.5 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="flex items-center gap-2 text-right text-sm font-semibold">
        {value || '—'}
        {action}
      </span>
    </div>
  );
}

export function AddressSection() {
  return (
    <Card className="max-w-2xl">
      <h2 className="font-bold">Address</h2>
      <p className="mt-2 text-sm text-muted">
        Delivery and pickup addresses are managed during onboarding and each order.
      </p>
      <Link to="/app/kyc" className="mt-4 inline-flex text-sm font-semibold text-primary">
        Review onboarding profile
      </Link>
    </Card>
  );
}

export function PreferencesSection() {
  const { theme, setTheme } = useTheme();
  return (
    <Card className="max-w-2xl">
      <h2 className="font-bold">Preferences</h2>
      <div className="mt-4">
        <FormField label="Appearance">
          <Select value={theme} onChange={(e) => setTheme(e.target.value as typeof theme)}>
            <option value="system">Match system</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </Select>
        </FormField>
      </div>
    </Card>
  );
}

export function SecurityHubSection() {
  return (
    <Card className="max-w-2xl grid gap-2">
      <SettingsMenuRow to="/app/settings/password" label="Change password" icon={LockKeyhole} />
      <SettingsMenuRow to="/app/settings/payment" label="Payment settings" icon={KeyRound} />
      <SettingsMenuRow to="/app/settings/biometrics" label="Biometrics" icon={Fingerprint} />
      <SettingsMenuRow to="/app/settings/deactivate" label="Close account" icon={ShieldAlert} />
    </Card>
  );
}

export function PasswordSection({ onDone }: { onDone?: () => void }) {
  const { session, logout } = useAuth();
  const { notice, setMessage } = useSettingsMessage();
  const [success, setSuccess] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session) return;
    const d = new FormData(e.currentTarget);
    const a = String(d.get('new'));
    const b = String(d.get('confirm'));
    if (a !== b) return setMessage('New passwords do not match.');
    try {
      await settingsApi.changePassword(
        session.accessToken,
        String(d.get('current')),
        a,
      );
      setSuccess(true);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Password change failed');
    }
  }

  return (
    <>
      <Card className="max-w-xl">
        <h2 className="text-lg font-bold">Reset password</h2>
        {notice}
        <form className="mt-5 grid gap-4" onSubmit={submit}>
          <FormField label="Current password">
            <PasswordInput name="current" required />
          </FormField>
          <FormField label="New password">
            <PasswordInput name="new" required minLength={8} placeholder="Enter new password" />
          </FormField>
          <FormField label="Confirm new password">
            <PasswordInput name="confirm" required placeholder="Confirm new password" />
          </FormField>
          <Button type="submit" className="h-11">
            Save
          </Button>
        </form>
      </Card>
      <SuccessDialog
        open={success}
        title="Password successfully saved"
        onContinue={() => {
          setSuccess(false);
          onDone?.();
          void logout();
        }}
      />
    </>
  );
}

export function PaymentHubSection() {
  return (
    <Card className="max-w-2xl grid gap-2">
      <SettingsMenuRow to="/app/settings/pin" label="Change transaction PIN" icon={KeyRound} />
      <SettingsMenuRow to="/app/settings/pin-reset" label="Forgot transaction PIN" icon={LockKeyhole} />
    </Card>
  );
}

export function ChangePinSection({ onDone }: { onDone?: () => void }) {
  const { session } = useAuth();
  const { notice, setMessage } = useSettingsMessage();
  const [success, setSuccess] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session) return;
    const d = new FormData(e.currentTarget);
    const pin = String(d.get('new'));
    if (pin !== String(d.get('confirm'))) return setMessage('PINs do not match.');
    try {
      await settingsApi.changePin(session.accessToken, String(d.get('current')), pin);
      setSuccess(true);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'PIN change failed');
    }
  }

  return (
    <>
      <Card className="max-w-xl">
        <h2 className="text-lg font-bold">Change transaction PIN</h2>
        {notice}
        <form className="mt-5 grid gap-4" onSubmit={submit}>
          <FormField label="Current PIN">
            <PasswordInput name="current" inputMode="numeric" maxLength={4} required />
          </FormField>
          <FormField label="New PIN">
            <PasswordInput name="new" inputMode="numeric" maxLength={4} required />
          </FormField>
          <FormField label="Confirm new PIN">
            <PasswordInput name="confirm" inputMode="numeric" maxLength={4} required />
          </FormField>
          <Button type="submit" className="h-11">
            Save
          </Button>
        </form>
      </Card>
      <SuccessDialog
        open={success}
        title="PIN successfully saved"
        onContinue={() => {
          setSuccess(false);
          onDone?.();
        }}
      />
    </>
  );
}

export function ForgotPinSection() {
  const { session } = useAuth();
  const { notice, setMessage } = useSettingsMessage();
  const [requested, setRequested] = useState(false);
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (!resendIn) return;
    const t = window.setTimeout(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  async function requestCode() {
    if (!session) return;
    try {
      await settingsApi.requestPinReset(session.accessToken);
      setRequested(true);
      setResendIn(50);
      setMessage('Check your email for a six-digit code.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not send code');
    }
  }

  async function confirm(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    if (pin !== confirmPin) return setMessage('PINs do not match.');
    try {
      await settingsApi.resetPin(session.accessToken, code, pin);
      setSuccess(true);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'PIN reset failed');
    }
  }

  if (!requested) {
    return (
      <Card className="max-w-xl">
        <h2 className="text-lg font-bold">Forgot PIN</h2>
        <p className="mt-2 text-sm text-muted">
          We will send a code to your verified email to reset your transaction PIN.
        </p>
        {notice}
        <Button type="button" className="mt-6 h-11 w-full" onClick={requestCode}>
          Continue
        </Button>
      </Card>
    );
  }

  return (
    <>
      <Card className="max-w-xl">
        <h2 className="text-lg font-bold">6 digit code</h2>
        <p className="mt-2 text-sm text-muted">Please check your email for a 6 digit code.</p>
        {notice}
        <form className="mt-6 grid gap-6" onSubmit={confirm}>
          <SegmentedOtp value={code} onChange={setCode} />
          <FormField label="New PIN">
            <PasswordInput
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              inputMode="numeric"
              maxLength={4}
              required
            />
          </FormField>
          <FormField label="Confirm new PIN">
            <PasswordInput
              value={confirmPin}
              onChange={(e) =>
                setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))
              }
              inputMode="numeric"
              maxLength={4}
              required
            />
          </FormField>
          <Button type="submit" className="h-11" disabled={code.length !== 6}>
            Save
          </Button>
          <p className="text-center text-sm text-muted">
            Didn&apos;t get code?{' '}
            <button
              type="button"
              className="font-semibold text-primary disabled:opacity-40"
              disabled={resendIn > 0}
              onClick={requestCode}
            >
              {resendIn > 0 ? `Resend in 0:${String(resendIn).padStart(2, '0')}` : 'Resend'}
            </button>
          </p>
        </form>
      </Card>
      <SuccessDialog
        open={success}
        title="PIN successfully saved"
        onContinue={() => setSuccess(false)}
      />
    </>
  );
}

export function ReferralsSection({ profile }: { profile: AccountProfile | null }) {
  const [rulesOpen, setRulesOpen] = useState(false);
  const inviteLink = useMemo(() => {
    const ref = profile?.accountNumber ?? profile?.id ?? '';
    if (typeof window === 'undefined' || !ref) return '';
    return `${window.location.origin}/auth/sign-up?referral=${encodeURIComponent(ref)}`;
  }, [profile]);

  async function copy() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
  }

  return (
    <>
      <div className="grid max-w-4xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,.9fr)]">
        <Card className="bg-gradient-to-br from-primary to-primary/85 text-primary-foreground">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm opacity-90">Total earned</p>
              <p className="mt-1 text-3xl font-black">₦0</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="border-white/30 bg-white/15 text-white hover:bg-white/25"
              onClick={() => setRulesOpen(true)}
            >
              Rules
            </Button>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/25 pt-4 text-sm">
            <div>
              <p className="opacity-80">Invitees</p>
              <p className="text-lg font-bold">0</p>
            </div>
            <div>
              <p className="opacity-80">Completed</p>
              <p className="text-lg font-bold">0</p>
            </div>
          </div>
        </Card>
        <Card>
          <h2 className="font-bold text-primary">Invite friends to Pepsa, earn rewards</h2>
          <p className="mt-2 text-sm text-muted">
            Referral rewards are coming soon. Share your link now so friends can sign up.
          </p>
          <div className="mt-5 grid gap-3">
            <Button type="button" className="h-11 gap-2" disabled={!inviteLink} onClick={copy}>
              Copy the link
            </Button>
            {profile?.accountNumber ? (
              <p className="text-center text-xs text-muted">
                Invitation code {profile.accountNumber}
              </p>
            ) : null}
          </div>
        </Card>
      </div>
      <Dialog open={rulesOpen} title="Referral rules" onClose={() => setRulesOpen(false)} panelClassName="sm:max-w-lg">
        <ul className="list-disc space-y-3 pl-5 text-sm text-muted">
          <li>Only verified Pepsa customers can refer others.</li>
          <li>Each customer receives a unique referral link.</li>
          <li>Self-registration and duplicate accounts are disqualified.</li>
          <li>
            A referral completes when the invitee verifies their account and places at least one
            qualifying delivery within 30 days.
          </li>
          <li>Rewards are credited to your Pepsa wallet when the program is live.</li>
        </ul>
      </Dialog>
    </>
  );
}

export function FaqSection() {
  const faqs = [
    [
      'How do I place my order?',
      'Open Orders for a quote first, then add pickup, delivery, and parcel details before payment.',
    ],
    [
      'Do I need an account to shop on Pepsa?',
      'Yes. Wallet, delivery, and business link features require a verified Pepsa account.',
    ],
    [
      'What payment methods do you accept?',
      'Fund your Pepsa wallet by bank transfer and pay for delivery, airtime, and bills from your balance.',
    ],
    [
      'How long does delivery take?',
      'Timing depends on route and service type. You will see an estimated quote before you pay.',
    ],
    [
      'How can I track my order?',
      'Open the delivery record from Orders to view the latest status.',
    ],
    [
      'Do you deliver internationally?',
      'Pepsa currently supports routes configured for our operating markets.',
    ],
  ];
  return (
    <div className="max-w-3xl">
      <div className="mb-6 overflow-hidden rounded-3xl border bg-primary-soft/40 p-6 text-center">
        <p className="text-sm font-semibold text-muted">FAQ</p>
        <h2 className="mt-1 text-xl font-bold">Answers at a glance</h2>
      </div>
      <Card>
        {faqs.map(([q, a]) => (
          <details key={q} className="group border-b border-border/70 py-4 last:border-0">
            <summary className="cursor-pointer list-none font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-3">
                {q}
                <span className="text-primary group-open:rotate-180">⌄</span>
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted">{a}</p>
          </details>
        ))}
      </Card>
    </div>
  );
}

export function SupportSection() {
  return (
    <Card className="max-w-2xl">
      <div className="flex items-center gap-3">
        <Headphones className="text-primary" />
        <h2 className="font-bold">Customer support</h2>
      </div>
      <p className="mt-3 text-sm text-muted">We are here to help with deliveries, wallet, and account issues.</p>
      <div className="mt-4 grid gap-3">
        <a className="font-semibold text-primary underline" href={`mailto:${env.VITE_SUPPORT_EMAIL}`}>
          {env.VITE_SUPPORT_EMAIL}
        </a>
        {env.VITE_SUPPORT_CHAT_URL ? (
          <a className="font-semibold text-primary underline" href={env.VITE_SUPPORT_CHAT_URL} target="_blank" rel="noreferrer">
            Open support chat
          </a>
        ) : null}
      </div>
    </Card>
  );
}

export function AboutSection() {
  return (
    <Card className="max-w-2xl grid gap-3">
      <div className="flex items-center gap-2">
        <BookOpen className="text-primary" size={20} />
        <h2 className="font-bold">About Pepsa</h2>
      </div>
      <Link className="text-primary underline" to="/terms">
        Terms and conditions
      </Link>
      <Link className="text-primary underline" to="/privacy">
        Privacy policy
      </Link>
      <Link className="text-primary underline" to="/indemnity">
        Indemnity agreement
      </Link>
      <p className="text-sm text-muted">Pepsa Customer {env.VITE_APP_VERSION}</p>
    </Card>
  );
}

export function BiometricsSection() {
  return (
    <Card className="max-w-2xl">
      <h2 className="font-bold">Biometrics</h2>
      <p className="mt-2 text-sm text-muted">
        Biometrics unlock the Pepsa mobile app on your device. They never approve wallet transfers or
        delivery payments on the web.
      </p>
    </Card>
  );
}

export function DeactivateSection() {
  const { session, setSession } = useAuth();
  const navigate = useNavigate();
  const [requested, setRequested] = useState(false);
  const [code, setCode] = useState('');
  const { notice, setMessage } = useSettingsMessage();
  if (!session) return null;
  const token = session.accessToken;

  async function request() {
    try {
      await settingsApi.requestDeactivation(token);
      setRequested(true);
      setMessage('A six-digit code was sent to your email.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Request failed');
    }
  }

  async function confirm() {
    try {
      await settingsApi.deactivate(token, code);
      setSession(null);
      navigate('/auth/login', { replace: true });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Deactivation failed');
    }
  }

  return (
    <Card className="max-w-2xl border-danger/30">
      <Alert tone="danger" title="Close account">
        This disables login and revokes every device session. Records are retained where required by
        law.
      </Alert>
      <div className="mt-4">{notice}</div>
      {requested ? (
        <div className="mt-4 grid gap-4">
          <SegmentedOtp value={code} onChange={setCode} />
          <Button variant="danger" disabled={code.length !== 6} onClick={confirm}>
            Yes, close account
          </Button>
        </div>
      ) : (
        <Button className="mt-4" variant="danger" onClick={request}>
          Send verification code
        </Button>
      )}
    </Card>
  );
}