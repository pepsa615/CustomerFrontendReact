import { cn } from '../../utils/cn';

export function IntroPagination({
  total,
  activeIndex,
  onSelect,
  className,
}: {
  total: number;
  activeIndex: number;
  onSelect: (index: number) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={`Onboarding page ${activeIndex + 1} of ${total}`}
      className={cn('flex items-center justify-center gap-1.5', className)}
    >
      {Array.from({ length: total }, (_, index) => (
        <button
          key={index}
          type="button"
          aria-label={`Show onboarding page ${index + 1}`}
          aria-current={index === activeIndex ? 'step' : undefined}
          onClick={() => onSelect(index)}
          className={cn(
            'h-2 rounded-full border border-primary/25 bg-surface transition-all',
            index === activeIndex
              ? 'w-6 border-primary'
              : 'w-3 hover:border-primary/60',
          )}
        />
      ))}
    </div>
  );
}