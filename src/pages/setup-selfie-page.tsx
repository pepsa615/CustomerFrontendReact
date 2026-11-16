import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button } from '../components/ui';
import { AuthStepLayout } from '../features/identity/auth-step-layout';
import { prefersNativeOnboarding } from '../features/identity/registration-flow';
import { setPendingSelfie } from '../features/identity/setup-selfie-store';

export function Component() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const preview = useMemo(
    () => (selfie ? URL.createObjectURL(selfie) : ''),
    [selfie],
  );
  const [error, setError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const mobile = prefersNativeOnboarding();

  useEffect(
    () => () => streamRef.current?.getTracks().forEach((track) => track.stop()),
    [],
  );
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  async function enableCamera() {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera is unavailable. Choose a photo instead.');
      return;
    }
    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'user' } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch {
      setError('Allow camera access or upload a selfie image instead.');
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      setSelfie(new File([blob], 'selfie.jpg', { type: 'image/jpeg' }));
      streamRef.current?.getTracks().forEach((track) => track.stop());
      setCameraReady(false);
    }, 'image/jpeg', 0.9);
  }

  function skip() {
    if (mobile) return;
    navigate('/app', { replace: true });
  }

  function continueWithSelfie() {
    if (!selfie) return;
    setPendingSelfie(selfie);
    navigate('/auth/setup/selfie/review');
  }

  return (
    <AuthStepLayout
      backTo="/auth/setup/pin"
      title="Take a picture for Identification"
      headerClassName="text-center lg:text-left"
      className="text-center lg:text-left"
    >
      <div className="grid gap-6">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <div className="mx-auto grid w-full max-w-sm justify-items-center gap-6">
          {preview ? (
            <img
              src={preview}
              alt="Captured selfie"
              className="aspect-square w-56 rounded-full border-8 border-surface-muted object-cover sm:w-64"
            />
          ) : (
            <SelfieAvatarFrame>
              <video
                ref={videoRef}
                muted
                playsInline
                className="hidden size-full rounded-full object-cover"
              />
              <span className="grid size-24 place-items-center rounded-full bg-surface-muted text-muted">
                <span className="size-16 rounded-full bg-border" />
              </span>
            </SelfieAvatarFrame>
          )}
          {preview ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSelfie(null);
                void enableCamera();
              }}
            >
              Retake
            </Button>
          ) : (
            <div className="grid gap-3">
              <Button
                type="button"
                className="mx-auto grid size-20 rounded-full p-0"
                onClick={() => void (cameraReady ? capture() : enableCamera())}
                aria-label="Open camera"
              >
                <Camera size={28} aria-hidden />
              </Button>
              <label className="cursor-pointer text-sm font-semibold text-primary">
                Upload photo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => setSelfie(event.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          )}
        </div>
        <Button
          type="button"
          disabled={!selfie}
          className="min-h-14 rounded-2xl text-base"
          onClick={continueWithSelfie}
        >
          Continue
        </Button>
        {!mobile ? (
          <Button type="button" variant="ghost" onClick={skip}>
            Skip for now
          </Button>
        ) : null}
      </div>
    </AuthStepLayout>
  );
}

function SelfieAvatarFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid size-56 place-items-center rounded-full border-[10px] border-surface-muted bg-surface-muted/40 sm:size-64">
      {children}
    </div>
  );
}