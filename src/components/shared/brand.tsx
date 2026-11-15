import { cn } from '../../utils/cn';

export function Brand({
  inverse = false,
  className,
}: {
  inverse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 font-black tracking-tight',
        inverse ? 'text-white' : 'text-primary',
        className,
      )}
    >
      <img
        src="/icons/pepsa-192.png"
        alt=""
        className="size-8 rounded-lg"
        aria-hidden
      />
      <span>PEPSA</span>
    </span>
  );
}
