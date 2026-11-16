import { cn } from '../../utils/cn';

export function Brand({
  inverse = false,
  compact = false,
  className,
}: {
  inverse?: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <img
      className={cn('h-9 w-auto', inverse && 'brightness-0 invert', className)}
      src={compact ? '/pepsa-mark.svg' : '/pepsa-wordmark.svg'}
      alt="Pepsa"
    />
  );
}