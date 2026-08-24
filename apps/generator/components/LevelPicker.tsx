"use client";

import type { Level } from "@ptg/core";
import { useLocale } from "../lib/i18n/useLocale";

const LEVELS: Level[] = [1, 2, 3, 4, 5, 6];

/** The two-column level grid with the self-reported tier names. */
export function LevelPicker({ value, onChange, labelledBy, label }: {
  value: Level;
  onChange: (level: Level) => void;
  labelledBy?: string;
  label?: string;
}) {
  const { t } = useLocale();
  return (
    <div className="levels" role="group" aria-labelledby={labelledBy} aria-label={label}>
      {LEVELS.map((option) => (
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
    </div>
  );
}
