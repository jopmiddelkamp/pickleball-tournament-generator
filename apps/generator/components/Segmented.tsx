"use client";

/** The pill-row choice control used for courts, spots, gender and tabs. */
export function Segmented<T extends string | number>({ options, value, onChange, format, labelledBy, label, disabled }: {
  options: readonly T[];
  value: T;
  onChange: (option: T) => void;
  /** display text per option; defaults to the option itself */
  format?: (option: T) => string;
  labelledBy?: string;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <div className="segmented" role="group" aria-labelledby={labelledBy} aria-label={label}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className="segmented__option"
          aria-pressed={value === option}
          disabled={disabled}
          onClick={() => onChange(option)}
        >
          {format ? format(option) : option}
        </button>
      ))}
    </div>
  );
}
