import { useMemo, useState } from 'react';
import { Dialog, Input } from '../../../components/ui';

export function WalletPickerSheet({
  open,
  title,
  items,
  selectedId,
  onSelect,
  onClose,
}: {
  open: boolean;
  title: string;
  items: Array<{ id: string; label: string; meta?: string }>;
  selectedId?: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(needle) ||
        item.meta?.toLowerCase().includes(needle),
    );
  }, [items, query]);

  return (
    <Dialog
      open={open}
      title={title}
      onClose={() => {
        setQuery('');
        onClose();
      }}
    >
      <div className="grid gap-4">
        <Input
          aria-label="Search"
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <ul className="max-h-[min(60vh,420px)] divide-y overflow-y-auto rounded-xl border">
          {filtered.map((item) => {
            const active = item.id === selectedId;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left hover:bg-surface-muted"
                  onClick={() => {
                    onSelect(item.id);
                    setQuery('');
                    onClose();
                  }}
                >
                  <span>
                    <span className="block font-semibold">{item.label}</span>
                    {item.meta ? (
                      <span className="text-xs text-muted">{item.meta}</span>
                    ) : null}
                  </span>
                  <span
                    className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${
                      active
                        ? 'border-primary bg-primary'
                        : 'border-border bg-primary-soft/40'
                    }`}
                    aria-hidden
                  >
                    {active ? (
                      <span className="size-2 rounded-full bg-white" />
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
          {!filtered.length ? (
            <li className="px-4 py-8 text-center text-sm text-muted">
              No matches
            </li>
          ) : null}
        </ul>
      </div>
    </Dialog>
  );
}