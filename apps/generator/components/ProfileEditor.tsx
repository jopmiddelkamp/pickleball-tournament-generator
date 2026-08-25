"use client";

import type { Gender, Level } from "@ptg/core";
import { useState } from "react";
import { useLocale } from "../lib/i18n/useLocale";
import type { PlayerProfile } from "../lib/validate";
import { LevelPicker } from "./LevelPicker";
import { Segmented } from "./Segmented";

/**
 * Inline correction of how someone plays and their level. The name is not
 * here on purpose: a registration is a person's place in the queue, and a
 * profile fix must never turn into handing that place to someone else.
 */
export function ProfileEditor({ name, initial, pending, onSave, onCancel }: {
  name: string;
  initial: PlayerProfile;
  pending: boolean;
  onSave: (profile: PlayerProfile) => void;
  onCancel: () => void;
}) {
  const { t } = useLocale();
  const [gender, setGender] = useState<Gender>(initial.gender);
  const [level, setLevel] = useState<Level>(initial.level);

  return (
    <div className="stack">
      <span className="label label--inline">{name}</span>
      <Segmented
        options={["F", "M"] as const}
        value={gender}
        onChange={setGender}
        format={(option) => t.gender[option]}
        label={t.roster.playsAs}
      />
      <LevelPicker value={level} onChange={setLevel} label={t.roster.level} />
      <div className="row">
        <button type="button" className="button button--accent button--small" disabled={pending} onClick={() => onSave({ gender, level })}>
          {t.roster.save}
        </button>
        <button type="button" className="button button--quiet button--small" disabled={pending} onClick={onCancel}>
          {t.roster.cancelEdit}
        </button>
      </div>
    </div>
  );
}
