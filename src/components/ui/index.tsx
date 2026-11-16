import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    loading?: boolean;
  }
>(
  (
    {
      className,
      type = 'button',
      variant = 'primary',
      loading,
      children,
      disabled,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex min-h-12 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' &&
          'bg-primary text-primary-foreground hover:bg-primary-hover',
        variant === 'secondary' &&
          'border bg-surface text-foreground hover:bg-surface-muted',
        variant === 'ghost' && 'text-primary hover:bg-primary-soft',
        variant === 'danger' && 'bg-danger text-white',
        className,
      )}
      {...props}
    >
      {loading ? (
        <span
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden
        />
      ) : null}
      {children}
    </button>
  ),
);
export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { label: string }
>(({ label, className, ...props }, ref) => (
  <button
    ref={ref}
    aria-label={label}
    className={cn(
      'grid size-11 place-items-center rounded-xl text-muted hover:bg-surface-muted hover:text-foreground',
      className,
    )}
    {...props}
  />
));
export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'min-h-12 min-w-0 w-full rounded-xl border bg-surface px-4 text-base text-foreground shadow-xs placeholder:text-muted focus:border-primary sm:text-sm',
      className,
    )}
    {...props}
  />
));
export const PasswordInput = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>
>(({ className, ...props }, ref) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        ref={ref}
        type={visible ? 'text' : 'password'}
        className={cn('pr-12', className)}
        {...props}
      />
      <IconButton
        type="button"
        label={visible ? 'Hide password' : 'Show password'}
        onClick={() => setVisible((value) => !value)}
        className="absolute right-0.5 top-0.5"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </IconButton>
    </div>
  );
});
export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'min-h-12 w-full rounded-xl border bg-surface px-4',
      className,
    )}
    {...props}
  />
));
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'min-h-28 w-full rounded-xl border bg-surface p-4',
      className,
    )}
    {...props}
  />
));
export const Checkbox = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>
>((props, ref) => (
  <input
    ref={ref}
    type="checkbox"
    className="size-5 rounded accent-primary"
    {...props}
  />
));
export const Radio = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>
>((props, ref) => (
  <input ref={ref} type="radio" className="size-5 accent-primary" {...props} />
));
export const Switch = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    type="checkbox"
    role="switch"
    className={cn(
      'h-6 w-11 appearance-none rounded-full bg-border p-0.5 transition before:block before:size-5 before:rounded-full before:bg-white before:shadow before:transition checked:bg-primary checked:before:translate-x-5',
      className,
    )}
    {...props}
  />
));
export const DateInput = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>
>((props, ref) => <Input ref={ref} type="date" {...props} />);
export function OtpInput({
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
  return (
    <Input
      name="code"
      aria-label={label}
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={length}
      value={value}
      onChange={(event) =>
        onChange(event.target.value.replace(/\D/g, '').slice(0, length))
      }
      className="text-center font-mono text-xl tracking-[0.35em] sm:tracking-[0.55em]"
    />
  );
}
export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'min-w-0 rounded-2xl border bg-surface p-5 shadow-sm sm:rounded-3xl sm:p-6',
        className,
      )}
    >
      {children}
    </section>
  );
}
export function FormField({
  label,
  error,
  hint,
  children,
  required,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  required?: boolean;
}) {
  const id = useId();
  return (
    <label
      className="grid min-w-0 gap-2 text-sm font-medium"
      aria-describedby={error || hint ? id : undefined}
    >
      {label}
      {required ? <span className="sr-only"> required</span> : null}
      {children}
      {error ? (
        <span id={id} role="alert" className="text-sm text-danger">
          {error}
        </span>
      ) : hint ? (
        <span id={id} className="text-xs text-muted">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('h-5 animate-pulse rounded bg-surface-muted', className)}
    />
  );
}
export function Alert({
  title,
  children,
  tone = 'info',
}: {
  title?: string;
  children: ReactNode;
  tone?: 'info' | 'success' | 'danger';
}) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn(
        'rounded-2xl border p-4 text-sm',
        tone === 'danger' && 'border-danger/30 bg-danger/5 text-danger',
        tone === 'success' && 'border-success/30 bg-success/5 text-success',
        tone === 'info' && 'bg-primary-soft text-foreground',
      )}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={title ? 'mt-1' : ''}>{children}</div>
    </div>
  );
}
export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="text-center">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </Card>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <Card className="border-danger/30">
      <h2 className="font-semibold text-danger">Something went wrong</h2>
      <p className="my-2 text-sm text-muted">{message}</p>
      {retry ? <Button onClick={retry}>Try again</Button> : null}
    </Card>
  );
}
export function Dialog({
  open,
  title,
  children,
  onClose,
  panelClassName,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  panelClassName?: string;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const listener = (event: KeyboardEvent) =>
      event.key === 'Escape' && onClose();
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-black/55 p-0 sm:place-items-center sm:p-4"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'max-h-[90dvh] w-full overflow-auto rounded-t-3xl bg-surface p-6 sm:max-w-md sm:rounded-3xl',
          panelClassName,
        )}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <IconButton ref={closeRef} label="Close" onClick={onClose}>
            <X size={20} />
          </IconButton>
        </div>
        <div className="mt-4">{children}</div>
      </section>
    </div>
  );
}
export const Sheet = Dialog;
export function Tabs({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (value: string) => void;
  items: { value: string; label: string }[];
}) {
  return (
    <div
      role="tablist"
      className="flex max-w-full overflow-x-auto rounded-xl bg-surface-muted p-1"
    >
      {items.map((item) => (
        <button
          key={item.value}
          role="tab"
          aria-selected={value === item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            'min-h-10 min-w-max flex-1 rounded-lg px-3 text-sm font-medium',
            value === item.value && 'bg-surface text-foreground shadow-sm',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
export function Toast({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] rounded-xl bg-foreground px-4 py-3 text-background shadow-lg sm:inset-x-auto sm:right-4"
    >
      {message}
    </div>
  );
}
