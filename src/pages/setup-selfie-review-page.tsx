import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import {
  peekPendingSelfie,
  setPendingSelfie,
} from '../features/identity/setup-selfie-store';
import { prefersNativeOnboarding } from '../features/identity/registration-flow';

export function Component() {
  const navigate = useNavigate();
  const selfie = peekPendingSelfie();
  const preview = useMemo(
    () => (selfie ? URL.createObjectURL(selfie) : ''),
    [selfie],
  );

  if (!selfie) {
    navigate('/auth/setup/selfie', { replace: true });
    return null;
  }

  return (
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-2xl flex-col xl:max-w-3xl">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="text-sm font-semibold text-muted"
          onClick={() => navigate('/auth/setup/selfie')}
        >
          Back
        </button>
        <button
          type="button"
          className="text-sm font-semibold text-muted"
          onClick={() => {
            setPendingSelfie(selfie);
            navigate('/auth/setup/selfie');
          }}
        >
          Retake
        </button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-10 py-8">
        {preview ? (
          <img
            src={preview}
            alt="Selfie preview"
            className="aspect-square w-full max-w-md rounded-full object-cover"
          />
        ) : null}
        <Button
          type="button"
          className="w-full max-w-md min-h-14 rounded-2xl text-base"
          onClick={() => navigate('/auth/setup/location')}
        >
          Continue
        </Button>
        {!prefersNativeOnboarding() ? (
          <Button
            type="button"
            variant="ghost"
            className="w-full max-w-md"
            onClick={() => navigate('/app', { replace: true })}
          >
            Skip for now
          </Button>
        ) : null}
      </div>
    </div>
  );
}