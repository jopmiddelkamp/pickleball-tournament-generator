"use client";

import { ALGORITHMS } from "@ptg/core";
import { useState } from "react";
import { useLocale } from "../lib/i18n/useLocale";

const TARGETS = [11, 16, 21];
const ROUNDS = [3, 4, 5, 6, 7, 8, 9, 10];

/** Game target and scheduler, shared by the create and edit event forms; both post as plain form fields. */
export function PlayStyleFields({ initialRounds, initialGameTarget, initialAlgorithmId, roundsDisabled = false }: {
  initialRounds: number;
  initialGameTarget: number;
  initialAlgorithmId: string;
  /** rounds freeze with the schedule; the other two never do */
  roundsDisabled?: boolean;
}) {
  const { t } = useLocale();
  const [algorithmId, setAlgorithmId] = useState(initialAlgorithmId);
  const selected = ALGORITHMS.find((a) => a.id === algorithmId) ?? ALGORITHMS[0]!;
  const describe = (id: string, fallback: { name: string; description: string }) => t.algorithms[id] ?? fallback;

  return (
    <>
      <div>
        <label className="label" htmlFor="event-rounds">{t.setup.rounds}</label>
        <select id="event-rounds" name="rounds" className="select" defaultValue={initialRounds} disabled={roundsDisabled}>
          {ROUNDS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        {roundsDisabled ? <input type="hidden" name="rounds" value={initialRounds} /> : null}
      </div>
      <div>
        <label className="label" htmlFor="event-target">{t.setup.gameTarget}</label>
        <select id="event-target" name="gameTarget" className="select" defaultValue={initialGameTarget}>
          {TARGETS.map((points) => (
            <option key={points} value={points}>
              {t.setup.points(points)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="event-algorithm">{t.setup.scheduler}</label>
        <select
          id="event-algorithm"
          name="algorithmId"
          className="select"
          value={algorithmId}
          onChange={(event) => setAlgorithmId(event.target.value)}
        >
          {ALGORITHMS.map((option) => (
            <option key={option.id} value={option.id}>
              {describe(option.id, option).name}
            </option>
          ))}
        </select>
        <p className="standings__detail" style={{ marginTop: 6 }}>{describe(selected.id, selected).description}</p>
      </div>
    </>
  );
}
