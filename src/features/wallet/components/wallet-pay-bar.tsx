import { Button } from '../../../components/ui';

export function WalletPayBar({
  label = 'Pay',
  loading,
  disabled,
  onClick,
  type = 'button',
}: {
  label?: string;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
}) {
  return (
    <div className="sticky bottom-0 -mx-5 mt-10 border-t bg-surface/95 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
      <Button
        type={type}
        className="h-14 w-full rounded-2xl text-base"
        loading={loading}
        disabled={disabled}
        onClick={onClick}
      >
        {label}
      </Button>
    </div>
  );
}