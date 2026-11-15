import {
  BriefcaseBusiness,
  Home,
  Link2,
  Moon,
  Package,
  ShieldCheck,
  Smartphone,
  Sun,
  Wallet,
  Settings,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTheme } from '../contexts/theme-context';
import { cn } from '../utils/cn';

const links = [
  { to: '/app', label: 'Overview', icon: Home, end: true },
  { to: '/app/orders', label: 'Orders', icon: Package },
  { to: '/app/wallet', label: 'Wallet', icon: Wallet },
  { to: '/app/business', label: 'Business', icon: BriefcaseBusiness },
  { to: '/app/delivery-links', label: 'Delivery links', icon: Link2 },
  { to: '/app/settings', label: 'Profile', icon: Settings },
  {
    to: '/app/security/transaction',
    label: 'Transaction security',
    icon: ShieldCheck,
  },
  { to: '/app/security/sessions', label: 'Devices', icon: Smartphone },
];

const mobileLinks = [links[0], links[2], links[4], links[5], links[7]];

export function AppLayout() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="min-h-dvh overflow-x-hidden bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="hidden border-r bg-surface p-4 lg:block lg:min-h-dvh">
        <div className="mb-5 flex items-center justify-between">
          <span className="text-xl font-black text-primary">PEPSA</span>
          <button
            className="rounded-lg p-2 hover:bg-surface-muted"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <nav aria-label="Main navigation" className="grid gap-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex min-w-max items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface-muted hover:text-foreground',
                  isActive &&
                    'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b bg-surface/95 px-5 backdrop-blur lg:hidden">
          <span className="text-xl font-black text-primary">PEPSA</span>
          <button
            className="grid size-11 place-items-center rounded-xl hover:bg-surface-muted"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>
        <Outlet />
      </div>
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur lg:hidden"
      >
        {mobileLinks.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-[0.68rem] font-medium text-muted',
                isActive && 'text-primary',
              )
            }
          >
            <Icon size={21} aria-hidden />
            <span className="max-w-full truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
