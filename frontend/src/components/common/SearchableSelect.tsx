import { useEffect, useId, useRef, useState } from 'react';

export interface SearchableSelectOption {
  value: string;
  label: string;
  meta?: string;
  keywords?: string;
}

interface SearchableSelectProps {
  id?: string;
  name: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function SearchableSelect({
  id,
  name,
  value,
  defaultValue = '',
  onValueChange,
  options,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search options...',
  emptyMessage = 'No matching options.',
  required = false,
  disabled = false,
}: SearchableSelectProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const selectedValue = isControlled ? value : internalValue;
  const selectedOption = options.find((option) => option.value === selectedValue);
  const filteredOptions = options.filter((option) => {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    const haystack = `${option.label} ${option.meta ?? ''} ${option.keywords ?? ''}`.toLowerCase();
    return haystack.includes(term);
  });

  useEffect(() => {
    setQuery(selectedOption?.label ?? '');
  }, [selectedOption?.label]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  function commitSelection(nextValue: string) {
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue);
    setOpen(false);
  }

  function clearSelection() {
    if (!isControlled) {
      setInternalValue('');
    }
    onValueChange?.('');
  }

  return (
    <div className={`searchable-select ${disabled ? 'disabled' : ''}`} ref={rootRef}>
      <input type="hidden" name={name} value={selectedValue} required={required} />
      <div className={`searchable-select-shell ${open ? 'open' : ''}`}>
        <div className="searchable-select-input-wrap">
          <i className="ti ti-search" />
          <input
            id={inputId}
            type="text"
            value={query}
            placeholder={selectedOption ? selectedOption.label : searchPlaceholder}
            disabled={disabled}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              const nextQuery = event.target.value;
              setQuery(nextQuery);
              if (selectedOption && nextQuery !== selectedOption.label) {
                clearSelection();
              }
              setOpen(true);
            }}
          />
          {selectedValue ? (
            <button
              type="button"
              className="searchable-select-clear"
              onClick={() => {
                setQuery('');
                clearSelection();
                setOpen(false);
              }}
              disabled={disabled}
              aria-label="Clear selection"
            >
              <i className="ti ti-x" />
            </button>
          ) : null}
        </div>
        {open ? (
          <div className="searchable-select-menu">
            {filteredOptions.length === 0 ? (
              <div className="searchable-select-empty">{emptyMessage}</div>
            ) : (
              <>
                {!selectedValue && !query.trim() ? (
                  <button
                    type="button"
                    className="searchable-select-option placeholder-option"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => commitSelection('')}
                  >
                    <span>{placeholder}</span>
                  </button>
                ) : null}
                {filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`searchable-select-option ${selectedValue === option.value ? 'active' : ''}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => commitSelection(option.value)}
                  >
                    <span className="searchable-select-label">{option.label}</span>
                    {option.meta ? <span className="searchable-select-meta">{option.meta}</span> : null}
                  </button>
                ))}
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
