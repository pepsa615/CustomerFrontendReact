import { Input } from '../../components/ui';

export function PhoneField({
  name = 'phone',
  defaultValue,
  value,
  onChange,
  required,
}: {
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <div className="flex min-h-12 items-center gap-2 rounded-xl border bg-surface px-3 text-sm font-medium shadow-xs">
        <span aria-hidden>🇳🇬</span>
        <span className="text-foreground">+234</span>
      </div>
      {onChange ? (
        <Input
          name={name}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="8012345678"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          className="min-w-0 flex-1"
        />
      ) : (
        <Input
          name={name}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="8012345678"
          defaultValue={defaultValue}
          required={required}
          className="min-w-0 flex-1"
        />
      )}
    </div>
  );
}

export function normalizeNgPhone(local: string, existing?: string) {
  const digits = local.replace(/\D/g, '');
  if (!digits) return existing ?? '';
  if (digits.startsWith('234')) return `+${digits}`;
  if (local.trim().startsWith('+')) return local.trim();
  return `+234${digits.replace(/^0/, '')}`;
}