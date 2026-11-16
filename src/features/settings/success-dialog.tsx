import { BadgeCheck } from 'lucide-react';
import { Button, Dialog } from '../../components/ui';

export function SuccessDialog({
  open,
  title,
  onContinue,
}: {
  open: boolean;
  title: string;
  onContinue: () => void;
}) {
  return (
    <Dialog open={open} title="Success" onClose={onContinue} panelClassName="sm:max-w-sm">
      <div className="grid place-items-center gap-5 pb-2 pt-2 text-center">
        <div className="grid size-28 place-items-center rounded-full bg-primary-soft">
          <div className="grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-md">
            <BadgeCheck size={34} />
          </div>
        </div>
        <p className="text-lg font-bold">{title}</p>
        <Button type="button" className="h-11 w-full" onClick={onContinue}>
          Continue
        </Button>
      </div>
    </Dialog>
  );
}