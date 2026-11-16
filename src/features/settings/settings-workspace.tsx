import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-context';
import { settingsApi, type AccountProfile } from './api';
import { SettingsHome } from './settings-home';
import { SettingsShell } from './settings-shell';
import { SettingsMenuGroup, SettingsMenuRow } from './settings-menu';
import {
  AboutSection,
  AddressSection,
  BiometricsSection,
  ChangePinSection,
  DeactivateSection,
  FaqSection,
  ForgotPinSection,
  PasswordSection,
  PaymentHubSection,
  PersonalSection,
  PreferencesSection,
  ReferralsSection,
  SecurityHubSection,
  SupportSection,
} from './settings-sections';
import {
  BookOpen,
  CircleHelp,
  Headphones,
  KeyRound,
  MapPin,
  Settings,
  SlidersHorizontal,
  UserRound,
  Users,
} from 'lucide-react';

const titles: Record<string, string> = {
  personal: 'Personal information',
  address: 'Address',
  preferences: 'Preferences',
  referrals: 'Referral records',
  security: 'Settings',
  password: 'Change password',
  payment: 'Payment settings',
  pin: 'Change transaction PIN',
  'pin-reset': 'Forgot transaction PIN',
  biometrics: 'Biometrics',
  faq: 'FAQ',
  support: 'Customer support',
  about: 'About',
  deactivate: 'Close account',
};

export function SettingsWorkspace() {
  const { section } = useParams();
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    settingsApi
      .profile(session.accessToken)
      .then(setProfile)
      .finally(() => setLoading(false));
  }, [session]);

  if (!session) return null;

  const navAside = section ? (
    <SettingsMenuGroup title="Profile menu">
      <SettingsMenuRow to="/app/settings/personal" label="Personal information" icon={UserRound} />
      <SettingsMenuRow to="/app/settings/address" label="Address" icon={MapPin} />
      <SettingsMenuRow to="/app/settings/preferences" label="Preferences" icon={SlidersHorizontal} />
      <SettingsMenuRow to="/app/settings/referrals" label="Referrals" icon={Users} />
      <SettingsMenuRow to="/app/settings/security" label="Settings" icon={Settings} />
      <SettingsMenuRow to="/app/settings/payment" label="Payment settings" icon={KeyRound} />
      <SettingsMenuRow to="/app/settings/faq" label="FAQ" icon={CircleHelp} />
      <SettingsMenuRow to="/app/settings/support" label="Support" icon={Headphones} />
      <SettingsMenuRow to="/app/settings/about" label="About" icon={BookOpen} />
    </SettingsMenuGroup>
  ) : undefined;

  if (!section) {
    return (
      <SettingsShell title="Profile" description="Account, security, and preferences">
        <SettingsHome profile={profile} onLogout={logout} />
      </SettingsShell>
    );
  }

  const token = session.accessToken;
  const common = { token, profile, setProfile, loading, navigate, logout };

  return (
    <SettingsShell
      title={titles[section] ?? 'Settings'}
      aside={navAside}
    >
      {section === 'personal' ? (
        <PersonalSection {...common} />
      ) : section === 'address' ? (
        <AddressSection />
      ) : section === 'preferences' ? (
        <PreferencesSection />
      ) : section === 'referrals' ? (
        <ReferralsSection profile={profile} />
      ) : section === 'security' ? (
        <SecurityHubSection />
      ) : section === 'password' ? (
        <PasswordSection />
      ) : section === 'payment' ? (
        <PaymentHubSection />
      ) : section === 'pin' ? (
        <ChangePinSection onDone={() => navigate('/app/settings/payment')} />
      ) : section === 'pin-reset' ? (
        <ForgotPinSection />
      ) : section === 'biometrics' ? (
        <BiometricsSection />
      ) : section === 'faq' ? (
        <FaqSection />
      ) : section === 'support' ? (
        <SupportSection />
      ) : section === 'about' ? (
        <AboutSection />
      ) : section === 'deactivate' ? (
        <DeactivateSection />
      ) : (
        <SettingsHome profile={profile} onLogout={logout} />
      )}
    </SettingsShell>
  );
}