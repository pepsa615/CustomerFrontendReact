import { useEffect, useState, type FormEvent } from 'react';
import {
  ChevronRight,
  CircleHelp,
  CreditCard,
  Fingerprint,
  Headphones,
  Info,
  LockKeyhole,
  LogOut,
  ShieldAlert,
  UserRound,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-context';
import { env } from '../../schemas/env';
import {
  Alert,
  Button,
  Card,
  Dialog,
  FormField,
  Input,
  OtpInput,
  PasswordInput,
} from '../../components/ui';
import { Page } from '../../components/shared/page';
import { settingsApi, type AccountProfile } from './api';

const items = [
  ['personal', 'Personal information', UserRound],
  ['password', 'Change password', LockKeyhole],
  ['payment', 'Payment settings', CreditCard],
  ['biometrics', 'Biometrics', Fingerprint],
  ['faq', 'FAQ', CircleHelp],
  ['support', 'Customer support', Headphones],
  ['about', 'About', Info],
  ['deactivate', 'Close account', ShieldAlert],
] as const;
function Row({
  to,
  label,
  Icon,
}: {
  to: string;
  label: string;
  Icon: typeof UserRound;
}) {
  return (
    <Link
      className="flex min-h-14 items-center gap-3 rounded-xl px-3 hover:bg-surface-muted focus-visible:outline"
      to={to}
    >
      <Icon className="text-primary" size={19} />
      <span className="flex-1 font-medium">{label}</span>
      <ChevronRight aria-hidden size={18} />
    </Link>
  );
}
function useMessage() {
  const [message, setMessage] = useState('');
  return {
    message,
    setMessage,
    notice: message ? <Alert>{message}</Alert> : null,
  };
}

export function SettingsWorkspace() {
  const { section } = useParams();
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutOpen, setLogoutOpen] = useState(false);
  useEffect(() => {
    if (!session) return;
    settingsApi
      .profile(session.accessToken)
      .then(setProfile)
      .finally(() => setLoading(false));
  }, [session]);
  if (!session) return null;
  if (!section)
    return (
      <Page
        title="Profile"
        description={profile?.fullName ?? 'Account and preferences'}
      >
        <div className="mx-auto max-w-2xl grid gap-5">
          <Card>
            <div className="grid size-16 place-items-center rounded-full bg-primary-soft text-2xl font-bold text-primary">
              {profile?.fullName?.[0] ?? 'P'}
            </div>
            <h2 className="mt-3 text-xl font-bold">
              {profile?.fullName ?? 'Loading…'}
            </h2>
          </Card>
          <Card className="grid gap-1">
            {items.map(([key, label, Icon]) => (
              <Row
                key={key}
                to={`/app/settings/${key}`}
                label={label}
                Icon={Icon}
              />
            ))}
          </Card>
          <Button variant="ghost" onClick={() => setLogoutOpen(true)}>
            <LogOut size={18} />
            Log out
          </Button>
          <Dialog
            open={logoutOpen}
            title="Log out"
            onClose={() => setLogoutOpen(false)}
          >
            <p>Are you sure you want to log out?</p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setLogoutOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => logout()}>
                Yes, log out
              </Button>
            </div>
          </Dialog>
        </div>
      </Page>
    );
  const common = {
    token: session.accessToken,
    profile,
    setProfile,
    loading,
    navigate,
    logout,
  };
  return (
    <Page title={items.find(([key]) => key === section)?.[1] ?? 'Settings'}>
      <div className="mx-auto max-w-2xl">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate('/app/settings')}
        >
          ← Back to profile
        </Button>
        {section === 'personal' ? (
          <Personal {...common} />
        ) : section === 'password' ? (
          <Password />
        ) : section === 'payment' ? (
          <Payment />
        ) : section === 'biometrics' ? (
          <InfoCard
            title="Biometrics are available in the mobile app"
            text="PEPSA biometrics only unlock your locally stored mobile session. They never approve payments or transfers."
          />
        ) : section === 'faq' ? (
          <Faq />
        ) : section === 'support' ? (
          <Support />
        ) : section === 'about' ? (
          <About />
        ) : section === 'deactivate' ? (
          <Deactivate />
        ) : (
          <InfoCard
            title="Not found"
            text="This settings page is unavailable."
          />
        )}
      </div>
    </Page>
  );
}

function Personal({
  token,
  profile,
  setProfile,
  loading,
}: {
  token: string;
  profile: AccountProfile | null;
  setProfile: (p: AccountProfile) => void;
  loading: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const { notice, setMessage } = useMessage();
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
  if (loading) return <Card>Loading personal information…</Card>;
  return (
    <Card>
      {notice}
      <div className="mt-4 grid gap-4">
        {editing ? (
          <form className="grid gap-4" onSubmit={submit}>
            <FormField label="Full name">
              <Input
                name="fullName"
                defaultValue={profile?.fullName}
                required
              />
            </FormField>
            <Button type="submit">Save</Button>
          </form>
        ) : (
          <>
            <Data label="Full name" value={profile?.fullName} />
            <Button variant="secondary" onClick={() => setEditing(true)}>
              Edit name
            </Button>
          </>
        )}
        <Data label="PEPSA account number" value={profile?.accountNumber} />
        <Data label="Mobile number" value={profile?.phone} />
        <Data label="Gender" value={profile?.gender} />
        <Data
          label="Date of birth"
          value={profile ? new Date(profile.dob).toLocaleDateString() : null}
        />
        <Data label="Email" value={profile?.email} />
        <Data label="NIN" value={profile?.maskedNin ?? 'Not provided'} />
      </div>
    </Card>
  );
}
function Data({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b py-3">
      <span className="text-muted">{label}</span>
      <span className="font-medium">{value || '—'}</span>
    </div>
  );
}
function Password() {
  const { session, logout } = useAuth();
  const { notice, setMessage } = useMessage();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session) return;
    const d = new FormData(e.currentTarget),
      a = String(d.get('new')),
      b = String(d.get('confirm'));
    if (a !== b) return setMessage('New passwords do not match.');
    try {
      await settingsApi.changePassword(
        session.accessToken,
        String(d.get('current')),
        a,
      );
      await logout();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Password change failed');
    }
  }
  return (
    <Card>
      {notice}
      <form className="grid gap-4" onSubmit={submit}>
        <FormField label="Current password">
          <PasswordInput name="current" required />
        </FormField>
        <FormField label="New password">
          <PasswordInput name="new" required minLength={8} />
        </FormField>
        <FormField label="Confirm new password">
          <PasswordInput name="confirm" required />
        </FormField>
        <Button type="submit">Save and sign in again</Button>
      </form>
    </Card>
  );
}
function Payment() {
  const { session } = useAuth();
  const { notice, setMessage } = useMessage();
  const [reset, setReset] = useState(false);
  async function change(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session) return;
    const d = new FormData(e.currentTarget),
      pin = String(d.get('new'));
    if (pin !== String(d.get('confirm')))
      return setMessage('PINs do not match.');
    try {
      await settingsApi.changePin(
        session.accessToken,
        String(d.get('current')),
        pin,
      );
      setMessage('Transaction PIN changed.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'PIN change failed');
    }
  }
  async function forgot() {
    if (!session) return;
    await settingsApi.requestPinReset(session.accessToken);
    setReset(true);
    setMessage('A reset code was sent to your email.');
  }
  async function resetPin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session) return;
    const d = new FormData(e.currentTarget);
    try {
      await settingsApi.resetPin(
        session.accessToken,
        String(d.get('code')),
        String(d.get('pin')),
      );
      setMessage('Transaction PIN reset.');
      setReset(false);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'PIN reset failed');
    }
  }
  return (
    <Card>
      {notice}
      {reset ? (
        <form className="mt-4 grid gap-4" onSubmit={resetPin}>
          <FormField label="Six-digit code">
            <Input name="code" inputMode="numeric" maxLength={6} required />
          </FormField>
          <FormField label="New four-digit PIN">
            <PasswordInput
              name="pin"
              inputMode="numeric"
              maxLength={4}
              required
            />
          </FormField>
          <Button type="submit">Reset PIN</Button>
        </form>
      ) : (
        <form className="mt-4 grid gap-4" onSubmit={change}>
          <FormField label="Current PIN">
            <PasswordInput
              name="current"
              inputMode="numeric"
              maxLength={4}
              required
            />
          </FormField>
          <FormField label="New PIN">
            <PasswordInput
              name="new"
              inputMode="numeric"
              maxLength={4}
              required
            />
          </FormField>
          <FormField label="Confirm new PIN">
            <PasswordInput
              name="confirm"
              inputMode="numeric"
              maxLength={4}
              required
            />
          </FormField>
          <Button type="submit">Save</Button>
          <Button variant="ghost" onClick={forgot}>
            Forgot transaction PIN?
          </Button>
        </form>
      )}
    </Card>
  );
}
function Deactivate() {
  const { session, setSession } = useAuth();
  const navigate = useNavigate();
  const [requested, setRequested] = useState(false);
  const [code, setCode] = useState('');
  const { notice, setMessage } = useMessage();
  if (!session) return null;
  async function request() {
    try {
      await settingsApi.requestDeactivation(session.accessToken);
      setRequested(true);
      setMessage('A six-digit code was sent to your email.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Request failed');
    }
  }
  async function confirm() {
    try {
      await settingsApi.deactivate(session.accessToken, code);
      setSession(null);
      navigate('/auth/login', { replace: true });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Deactivation failed');
    }
  }
  return (
    <Card className="border-danger/30">
      <Alert tone="danger" title="Close account">
        This immediately disables login and revokes every device. Financial and
        audit records are retained where required.
      </Alert>
      <div className="mt-4">{notice}</div>
      {requested ? (
        <div className="mt-4 grid gap-4">
          <OtpInput value={code} onChange={setCode} />
          <Button
            variant="danger"
            disabled={code.length !== 6}
            onClick={confirm}
          >
            Deactivate account
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
function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <Card>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-2 text-muted">{text}</p>
    </Card>
  );
}
function Faq() {
  const faqs = [
    [
      'How do I place an order?',
      'Open Orders, enter pickup, delivery and parcel details, then review the server-provided quote.',
    ],
    [
      'How do I fund my wallet?',
      'Open Wallet to view your dedicated funding account.',
    ],
    [
      'Can biometrics approve a transfer?',
      'No. Biometrics only unlock your saved mobile session; your transaction PIN remains required.',
    ],
    [
      'How do I track a delivery?',
      'Open the order detail page to view its latest status and tracking information.',
    ],
  ];
  return (
    <Card>
      {faqs.map(([q, a]) => (
        <details className="border-b py-4" key={q}>
          <summary className="cursor-pointer font-semibold">{q}</summary>
          <p className="mt-2 text-muted">{a}</p>
        </details>
      ))}
    </Card>
  );
}
function Support() {
  return (
    <Card>
      <h2 className="font-bold">We are here to help</h2>
      <div className="mt-4 grid gap-3">
        <a
          className="text-primary underline"
          href={`mailto:${env.VITE_SUPPORT_EMAIL}`}
        >
          {env.VITE_SUPPORT_EMAIL}
        </a>
        {env.VITE_SUPPORT_CHAT_URL ? (
          <a
            className="text-primary underline"
            href={env.VITE_SUPPORT_CHAT_URL}
            target="_blank"
            rel="noreferrer"
          >
            Open support chat
          </a>
        ) : null}
      </div>
    </Card>
  );
}
function About() {
  return (
    <Card className="grid gap-3">
      <a
        className="text-primary underline"
        href={env.VITE_TERMS_URL}
        target="_blank"
        rel="noreferrer"
      >
        Terms and conditions
      </a>
      <a
        className="text-primary underline"
        href={env.VITE_PRIVACY_URL}
        target="_blank"
        rel="noreferrer"
      >
        Privacy policy
      </a>
      <p className="text-sm text-muted">
        PEPSA Customer {env.VITE_APP_VERSION}
      </p>
    </Card>
  );
}
