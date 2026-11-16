import { useId, useRef, type KeyboardEvent } from 'react';
import { cn } from '../../utils/cn';

export function SegmentedOtp({
  value,
  onChange,
  length = 6,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
}) {
  const id = useId();
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(length, ' ').slice(0, length).split('');

  function setAt(index: number, char: string) {
    const next = digits.map((d, i) => (i === index ? char : d.trim())).join('');
    onChange(next.replace(/\s/g, '').slice(0, length));
  }

  function onDigit(index: number, raw: string) {
    const char = raw.replace(/\D/g, '').slice(-1);
    if (!char) {
      setAt(index, '');
      return;
    }
    setAt(index, char);
    if (index < length - 1) refs.current[index + 1]?.focus();
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index]?.trim() && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  const half = length / 2;

  return (
    <div
      role="group"
      aria-labelledby={id}
      className="flex flex-wrap items-center justify-center gap-2 sm:gap-3"
    >
      <span id={id} className="sr-only">
        Six digit verification code
      </span>
      {digits.map((digit, index) => (
        <span key={index} className="flex items-center gap-2 sm:gap-3">
          {index === half ? (
            <span aria-hidden className="px-1 text-xl text-muted">
              -
            </span>
          ) : null}
          <input
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            disabled={disabled}
            value={digit.trim()}
            aria-label={`Digit ${index + 1}`}
            className={cn(
              'size-11 rounded-xl border border-border bg-surface text-center text-lg font-semibold shadow-sm sm:size-12',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
            )}
            onChange={(event) => onDigit(index, event.target.value)}
            onKeyDown={(event) => onKeyDown(index, event)}
          />
        </span>
      ))}
    </div>
  );
}