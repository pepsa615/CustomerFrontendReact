import { useState } from 'react';
import {
  BookOpen,
  CircleHelp,
  Headphones,
  LogOut,
  MapPin,
  Settings,
  SlidersHorizontal,
  UserRound,
  Users,
} from 'lucide-react';
import { Button, Card, Dialog } from '../../components/ui';
import type { AccountProfile } from './api';
import { SettingsMenuGroup, SettingsMenuRow } from './settings-menu';

export function SettingsHome({
  profile,
  onLogout,
}: {
  profile: AccountProfile | null;
  onLogout: () => void;
}) {
  const [logoutOpen, setLogoutOpen] = useState(false);

  return (
    <div className="mx-auto grid max-w-3xl gap-5 lg:max-w-5xl xl:max-w-4xl">
      <Card className="text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-primary/10 text-2xl font-bold text-primary shadow-inner">
          {profile?.fullName?.[0] ?? 'P'}
        </div>
        <h2 className="mt-4 text-xl font-bold">{profile?.fullName ?? 'Your profile'}</h2>
        {profile?.accountNumber ? (
          <p className="mt-1 text-sm text-muted">Account {profile.accountNumber}</p>
        ) : null}
      </Card>

      <SettingsMenuGroup title="Personal details">
        <SettingsMenuRow to="/app/settings/personal" label="Personal information" icon={UserRound} />
        <SettingsMenuRow to="/app/settings/address" label="Address" icon={MapPin} />
        <SettingsMenuRow to="/app/settings/preferences" label="Preferences" icon={SlidersHorizontal} />
      </SettingsMenuGroup>

      <SettingsMenuGroup title="More">
        <SettingsMenuRow to="/app/settings/referrals" label="Referrals" icon={Users} />
        <SettingsMenuRow to="/app/settings/security" label="Settings" icon={Settings} />
        <SettingsMenuRow to="/app/settings/faq" label="FAQs" icon={CircleHelp} />
        <SettingsMenuRow to="/app/settings/support" label="Customer support" icon={Headphones} />
        <SettingsMenuRow to="/app/settings/about" label="About" icon={BookOpen} />
      </SettingsMenuGroup>

      <Button
        type="button"
        variant="ghost"
        className="mx-auto gap-2 text-primary"
        onClick={() => setLogoutOpen(true)}
      >
        <LogOut size={18} />
        Log out
      </Button>

      <Dialog open={logoutOpen} title="Logout" onClose={() => setLogoutOpen(false)}>
        <p className="text-center text-muted">Are you sure you want to log out?</p>
        <div className="mt-6 flex gap-3">
          <Button type="button" variant="secondary" className="flex-1" onClick={() => setLogoutOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            className="flex-1"
            onClick={() => {
              setLogoutOpen(false);
              onLogout();
            }}
          >
            Yes, logout
          </Button>
        </div>
      </Dialog>
    </div>
  );
}