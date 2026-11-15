import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, FormField, Input } from '../components/ui';
import { AuthCard } from '../features/identity/auth-card';
import { apiRequest } from '../api/client';
import { useAuth, type IdentityUser } from '../contexts/auth-context';
import { postAuthDestination } from '../features/orders/order-intent';
export function Component() {
  const { session, setSession } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function enableCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setError(
        'Camera permission was denied. You can choose an image instead.',
      );
    }
  }
  function capture() {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) =>
        blob &&
        setSelfie(new File([blob], 'selfie.jpg', { type: 'image/jpeg' })),
      'image/jpeg',
      0.9,
    );
  }
  function locate() {
    navigator.geolocation.getCurrentPosition(
      setLocation,
      () => setError('Location permission is required to complete onboarding.'),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }
  async function submit() {
    if (!selfie || !location || !session) return;
    setLoading(true);
    setError('');
    try {
      const body = new FormData();
      body.set('selfie', selfie);
      body.set('latitude', String(location.coords.latitude));
      body.set('longitude', String(location.coords.longitude));
      body.set('accuracyMeters', String(location.coords.accuracy));
      body.set('capturedAt', new Date(location.timestamp).toISOString());
      body.set('consent', 'true');
      const data = await apiRequest<{ user: IdentityUser }>(
        '/account/onboarding',
        {
          method: 'POST',
          headers: { authorization: `Bearer ${session.accessToken}` },
          body,
        },
      );
      setSession({ ...session, user: data.user });
      navigate(postAuthDestination());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Onboarding failed');
    } finally {
      setLoading(false);
    }
  }
  return (
    <AuthCard
      title="Finish identity setup"
      description="Take a clear selfie and share your current location. PEPSA stores this privately and never performs facial recognition."
    >
      <div className="grid gap-5">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <video
          ref={videoRef}
          muted
          playsInline
          className="aspect-[4/3] w-full rounded-2xl bg-surface-muted object-cover"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant="secondary" onClick={enableCamera}>
            Enable camera
          </Button>
          <Button variant="secondary" onClick={capture}>
            Capture selfie
          </Button>
        </div>
        <FormField label="Or choose a selfie image">
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setSelfie(event.target.files?.[0] ?? null)}
          />
        </FormField>
        {selfie ? (
          <Alert tone="success">Selfie ready: {selfie.name}</Alert>
        ) : null}
        <Button variant="secondary" onClick={locate}>
          Use current location
        </Button>
        {location ? (
          <Alert tone="success">
            Location captured with ±{Math.round(location.coords.accuracy)}m
            accuracy.
          </Alert>
        ) : null}
        <Button
          loading={loading}
          disabled={!selfie || !location || !session}
          onClick={submit}
        >
          Complete setup
        </Button>
      </div>
    </AuthCard>
  );
}
