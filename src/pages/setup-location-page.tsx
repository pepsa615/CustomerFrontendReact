import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button } from '../components/ui';
import { apiRequest } from '../api/client';
import { useAuth, type IdentityUser } from '../contexts/auth-context';
import {
  peekPendingSelfie,
  takePendingSelfie,
} from '../features/identity/setup-selfie-store';
import { prefersNativeOnboarding } from '../features/identity/registration-flow';
import { useTheme } from '../contexts/theme-context';
import { Moon, Sun } from 'lucide-react';

export function Component() {
  const { session, setSession } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { resolved, setTheme } = useTheme();
  const nextTheme = resolved === 'dark' ? 'light' : 'dark';

  async function enableLocation() {
    if (!session?.accessToken) return;
    setLoading(true);
    setError('');
    try {
      let location: GeolocationPosition | null = null;
      if (navigator.geolocation) {
        location = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 20000,
          });
        });
      }
      const selfie = takePendingSelfie() ?? peekPendingSelfie();
      if (!selfie && prefersNativeOnboarding()) {
        setError('Add a selfie before completing verification.');
        setLoading(false);
        return;
      }
      if (selfie && location) {
        const body = new FormData();
        body.set('selfie', selfie);
        body.set('latitude', String(location.coords.latitude));
        body.set('longitude', String(location.coords.longitude));
        body.set('accuracyMeters', String(location.coords.accuracy));
        body.set('capturedAt', new Date(location.timestamp).toISOString());
        body.set('consent', 'true');
        const data = await apiRequest<{ user: IdentityUser }>('/account/onboarding', {
          method: 'POST',
          headers: { authorization: `Bearer ${session.accessToken}` },
          body,
        });
        setSession({ ...session, user: data.user });
      }
      navigate('/app', { replace: true });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Turn on location access to continue.',
      );
    } finally {
      setLoading(false);
    }
  }

  function skip() {
    takePendingSelfie();
    navigate('/app', { replace: true });
  }

  return (
    <main className="fixed inset-0 z-50 grid min-h-dvh place-items-center bg-primary px-6 text-center text-primary-foreground">
      <button
        type="button"
        aria-label={`Switch to ${nextTheme} mode`}
        onClick={() => setTheme(nextTheme)}
        className="absolute right-5 top-5 grid size-11 place-items-center rounded-xl bg-primary-foreground/15 text-primary-foreground"
      >
        {resolved === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <div className="w-full max-w-lg xl:max-w-xl">
        <MapPin size={72} className="mx-auto" strokeWidth={1.5} aria-hidden />
        <h1 className="mt-10 text-2xl font-bold sm:text-3xl">Enable location</h1>
        <p className="mx-auto mt-3 max-w-sm text-base leading-6 text-white/90">
          We need your location to show potential matches nearby. Please enable
          location services.
        </p>
        {error ? (
          <div className="mx-auto mt-4 max-w-sm">
            <Alert tone="danger">{error}</Alert>
          </div>
        ) : null}
        <Button
          type="button"
          loading={loading}
          onClick={() => void enableLocation()}
          className="mt-10 w-full max-w-md bg-surface text-base font-bold text-foreground hover:bg-surface-muted"
        >
          Enable Location
        </Button>
        {!prefersNativeOnboarding() ? (
          <button
            type="button"
            className="mt-4 text-sm font-semibold text-white/95 underline"
            onClick={skip}
          >
            Skip for now
          </button>
        ) : null}
      </div>
    </main>
  );
}