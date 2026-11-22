import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, FormField, Input } from '../components/ui';
import { AuthCard } from '../features/identity/auth-card';
import { apiRequest } from '../api/client';
import { useAuth, type IdentityUser } from '../contexts/auth-context';
import { AddressSearch } from '../components/shared/address-search';
type CapturedLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};
export function Component() {
  const { session, setSession } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const selfiePreview = useMemo(
    () => (selfie ? URL.createObjectURL(selfie) : ''),
    [selfie],
  );
  const [location, setLocation] = useState<CapturedLocation | null>(null);
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [addressQuery, setAddressQuery] = useState('');
  useEffect(
    () => () => streamRef.current?.getTracks().forEach((track) => track.stop()),
    [],
  );
  useEffect(
    () => () => {
      if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    },
    [selfiePreview],
  );
  async function enableCamera() {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        'Camera capture is unavailable in this browser. Choose a selfie image instead.',
      );
      return;
    }
    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'user' } },
        });
      } catch (cause) {
        const denied =
          cause instanceof DOMException &&
          ['NotAllowedError', 'SecurityError'].includes(cause.name);
        if (!denied) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const camera = devices.find((device) => device.kind === 'videoinput');
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: camera ? { deviceId: { exact: camera.deviceId } } : true,
          });
        } else {
          throw cause;
        }
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (cause) {
      setCameraReady(false);
      const denied =
        cause instanceof DOMException &&
        ['NotAllowedError', 'SecurityError'].includes(cause.name);
      const unavailable =
        cause instanceof DOMException &&
        ['NotFoundError', 'DevicesNotFoundError'].includes(cause.name);
      setError(
        denied
          ? 'Camera access is blocked for this website. Allow Camera for customer.pepsa.co in your browser site settings, then try again.'
          : unavailable
            ? 'No camera was detected by the browser. Reconnect the camera or choose a selfie image.'
            : 'The camera is available but macOS could not open it. Fully quit and reopen the browser after granting Camera access, then retry or choose a selfie image.',
      );
    }
  }
  function capture() {
    const video = videoRef.current;
    if (!video?.videoWidth) {
      setError('Wait for the camera preview to appear before capturing.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError('The selfie could not be captured. Please try again.');
          return;
        }
        setSelfie(new File([blob], 'selfie.jpg', { type: 'image/jpeg' }));
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setCameraReady(false);
        setError('');
      },
      'image/jpeg',
      0.9,
    );
  }
  async function locate() {
    setError('');
    if (!navigator.geolocation) {
      setError('Location is unavailable in this browser.');
      return;
    }
    setLocating(true);
    const errorCode = (cause: unknown) =>
      typeof cause === 'object' && cause !== null && 'code' in cause
        ? Number((cause as { code: unknown }).code)
        : 0;
    const waitForPosition = () =>
      new Promise<GeolocationPosition>((resolve, reject) => {
        let lastError: unknown;
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            window.clearTimeout(timer);
            navigator.geolocation.clearWatch(watchId);
            resolve(position);
          },
          (cause) => {
            lastError = cause;
            if (errorCode(cause) === 1) {
              window.clearTimeout(timer);
              navigator.geolocation.clearWatch(watchId);
              reject(cause);
            }
          },
          { enableHighAccuracy: false, maximumAge: 120000, timeout: 10000 },
        );
        const timer = window.setTimeout(() => {
          navigator.geolocation.clearWatch(watchId);
          reject(lastError ?? new Error('Location request timed out'));
        }, 45000);
      });
    try {
      const position = await waitForPosition();
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      });
    } catch (cause) {
      const denied = errorCode(cause) === 1;
      setError(
        denied
          ? 'Location access is blocked for this website. Allow Location for customer.pepsa.co in your browser site settings, then try again.'
          : 'macOS could not determine your location. Turn on Wi-Fi (it may remain disconnected), keep Location Services enabled for this browser, and try again.',
      );
      setShowManualLocation(true);
    } finally {
      setLocating(false);
    }
  }
  async function submit() {
    if (!selfie || !location || !session) return;
    setLoading(true);
    setError('');
    try {
      const body = new FormData();
      body.set('selfie', selfie);
      body.set('latitude', String(location.latitude));
      body.set('longitude', String(location.longitude));
      body.set('accuracyMeters', String(location.accuracy));
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
      navigate('/app/wallet');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Onboarding failed');
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="mx-auto w-full min-w-0 max-w-xl px-4 py-6 sm:px-6 sm:py-8 lg:px-0">
      <AuthCard
        title="Verify your identity"
        description="A one-time security check is required before your first transfer or bill payment. It takes about two minutes."
      >
        <div className="grid min-w-0 gap-5 overflow-hidden">
          {error ? <Alert tone="danger">{error}</Alert> : null}
          {selfiePreview ? (
            <img
              src={selfiePreview}
              alt="Captured selfie preview"
              className="aspect-[4/3] max-h-[min(48dvh,30rem)] w-full rounded-2xl bg-surface-muted object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              muted
              playsInline
              className="aspect-[4/3] max-h-[min(48dvh,30rem)] w-full rounded-2xl bg-surface-muted object-cover"
            />
          )}
          {selfie ? (
            <Button
              variant="secondary"
              onClick={() => {
                setSelfie(null);
                window.setTimeout(() => void enableCamera(), 0);
              }}
            >
              Retake selfie
            </Button>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="secondary" onClick={enableCamera}>
                Enable camera
              </Button>
              <Button
                variant="secondary"
                disabled={!cameraReady}
                onClick={capture}
              >
                Capture selfie
              </Button>
            </div>
          )}
          <FormField label="Or choose a selfie image">
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="user"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setSelfie(file);
                if (file) {
                  streamRef.current
                    ?.getTracks()
                    .forEach((track) => track.stop());
                  streamRef.current = null;
                  setCameraReady(false);
                }
              }}
            />
          </FormField>
          {selfie ? (
            <Alert tone="success">Selfie ready: {selfie.name}</Alert>
          ) : null}
          <Button variant="secondary" loading={locating} onClick={locate}>
            Use current location
          </Button>
          {showManualLocation && !location ? (
            <div className="grid gap-3">
              <Alert>
                Automatic location is unavailable. Enter your current street
                address and PEPSA will securely resolve it through Google Maps.
              </Alert>
              <FormField label="Current address">
                <AddressSearch
                  value={addressQuery}
                  onChange={setAddressQuery}
                  onSelect={(address) => {
                    setAddressQuery(address.formattedAddress);
                    setLocation({
                      latitude: address.latitude,
                      longitude: address.longitude,
                      accuracy: 30,
                      timestamp: Date.now(),
                    });
                    setShowManualLocation(false);
                  }}
                />
              </FormField>
            </div>
          ) : null}
          {location ? (
            <Alert tone="success">
              Location captured with ±{Math.round(location.accuracy)}m accuracy.
            </Alert>
          ) : null}
          <Button
            loading={loading}
            disabled={!selfie || !location || !session}
            onClick={submit}
          >
            Complete verification
          </Button>
        </div>
      </AuthCard>
    </div>
  );
}
