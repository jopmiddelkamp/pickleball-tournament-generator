"use client";

import type { Level } from "@ptg/core";
import { useLocale } from "../lib/i18n/useLocale";

const LEVELS: Level[] = [1, 2, 3, 4, 5, 6];

/**
 * The two-column level grid with the self-reported tier names. `min` hides
 * the tiers an event does not admit; `allowUnsure` adds a "Not sure" tile,
 * reported as `null`, for someone who needs to read the guide first.
 */
export function LevelPicker({ value, onChange, min = 1, allowUnsure = false, labelledBy, label }: {
  value: Level | null;
  onChange: (level: Level | null) => void;
  /** lowest tier offered */
  min?: Level;
  allowUnsure?: boolean;
  labelledBy?: string;
  label?: string;
}) {
  const { t } = useLocale();
  return (
    <div className="levels" role="group" aria-labelledby={labelledBy} aria-label={label}>
      {LEVELS.filter((option) => option >= min).map((option) => (
        <button
          key={option}
          type="button"
          className="levels__option"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
        >
          {t.levels[option]}
        </button>
      ))}
      {allowUnsure ? (
        <button
          type="button"
          className="levels__option levels__option--unsure"
          aria-pressed={value === null}
          onClick={() => onChange(null)}
        >
          {t.public.notSure}
        </button>
      ) : null}
    </div>
  );
}
