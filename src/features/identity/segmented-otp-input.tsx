import { useId, useRef } from 'react';
import { cn } from '../../utils/cn';

export function SegmentedOtpInput({
  value,
  onChange,
  length = 6,
  label = 'Verification code',
}: {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  label?: string;
}) {
  const id = useId();
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(length, ' ').slice(0, length).split('');

  function updateAt(index: number, nextChar: string) {
    const digit = nextChar.replace(/\D/g, '').slice(-1);
    const next = digits.map((char, i) => (i === index ? digit : char)).join('');
    onChange(next.replace(/\s/g, ''));
    if (digit && index < length - 1) refs.current[index + 1]?.focus();
  }

  function onKeyDown(index: number, key: string) {
    if (key !== 'Backspace') return;
    if (digits[index]?.trim()) {
      updateAt(index, '');
      return;
    }
    if (index > 0) {
      refs.current[index - 1]?.focus();
      updateAt(index - 1, '');
    }
  }

  function onPaste(event: React.ClipboardEvent) {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, length);
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, length - 1);
    refs.current[focusIndex]?.focus();
  }

  return (
    <div>
      <span id={id} className="sr-only">
        {label}
      </span>
      <div
        role="group"
        aria-labelledby={id}
        className="flex items-center justify-between gap-2 sm:justify-start sm:gap-3"
        onPaste={onPaste}
      >
        {digits.map((digit, index) => (
          <span key={index} className="contents">
            <input
              ref={(node) => {
                refs.current[index] = node;
              }}
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              aria-label={`Digit ${index + 1} of ${length}`}
              maxLength={1}
              value={digit.trim()}
              onChange={(event) => updateAt(index, event.target.value)}
              onKeyDown={(event) => onKeyDown(index, event.key)}
              className={cn(
                'size-11 rounded-xl border bg-surface text-center text-lg font-semibold text-foreground shadow-xs focus:border-primary sm:size-12',
              )}
            />
            {index === 2 ? (
              <span aria-hidden className="px-0.5 text-lg text-muted">
                -
              </span>
            ) : null}
          </span>
        ))}
      </div>
    </div>
  );
}