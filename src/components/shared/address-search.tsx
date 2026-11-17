import { useEffect, useId, useState } from 'react';
import { MapPin } from 'lucide-react';
import { apiRequest } from '../../api/client';
import { Input } from '../ui';

export type SelectedAddress = {
  placeId: string;
  formattedAddress: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
};

type Suggestion = { placeId: string; description: string };

export function AddressSearch({
  value,
  onChange,
  onSelect,
  placeholder = 'Search for an address',
  required,
  className,
  name,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: SelectedAddress) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  name?: string;
}) {
  const listId = useId();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedValue, setSelectedValue] = useState(value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (value === selectedValue || value.trim().length < 3) {
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setBusy(true);
      setError('');
      apiRequest<Suggestion[]>(
        `/reference/places/autocomplete?input=${encodeURIComponent(value.trim())}`,
        {},
        controller.signal,
      )
        .then(setSuggestions)
        .catch((reason) => {
          if (!controller.signal.aborted) {
            setSuggestions([]);
            setError(
              reason instanceof Error
                ? reason.message
                : 'Address search is unavailable',
            );
          }
        })
        .finally(() => setBusy(false));
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [selectedValue, value]);

  async function choose(suggestion: Suggestion) {
    setBusy(true);
    setError('');
    try {
      const address = await apiRequest<SelectedAddress>(
        `/reference/places/details?placeId=${encodeURIComponent(suggestion.placeId)}`,
      );
      setSelectedValue(address.formattedAddress);
      onChange(address.formattedAddress);
      onSelect(address);
      setSuggestions([]);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Could not select that address',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <MapPin
        className="pointer-events-none absolute left-3 top-3.5 z-10 text-primary"
        size={18}
      />
      <Input
        name={name}
        value={value}
        required={required}
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls={listId}
        placeholder={placeholder}
        className={`pl-10 ${className ?? ''}`}
        onChange={(event) => {
          setSelectedValue('');
          setSuggestions([]);
          onChange(event.target.value);
        }}
      />
      {busy ? (
        <span className="absolute right-3 top-3.5 text-xs text-muted">
          Searching…
        </span>
      ) : null}
      {suggestions.length ? (
        <ul
          id={listId}
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-line bg-surface p-1 shadow-xl"
        >
          {suggestions.map((item) => (
            <li key={item.placeId}>
              <button
                type="button"
                className="w-full rounded-lg px-3 py-3 text-left text-sm hover:bg-surface-muted"
                onClick={() => void choose(item)}
              >
                {item.description}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {value && value !== selectedValue ? (
        <p className="mt-1 text-xs text-amber-700">
          Select an address from the suggestions.
        </p>
      ) : null}
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
