"use client";

import { useLocale } from "../lib/i18n/useLocale";

/** How the evening is scored, in the event's own numbers. Same screen for the organiser and the public page. */
export function RulesScreen({ gameTarget, roundMinutes }: { gameTarget: number; roundMinutes: number | null }) {
  const { t } = useLocale();
  const r = t.rules;
  const sections = [
    r.points(gameTarget),
    ...(roundMinutes !== null ? [r.clock(roundMinutes, gameTarget)] : []),
    r.bye,
    r.sameGender,
    r.ranking,
  ];
  return (
    <div>
      <h2 className="screen__heading">{r.heading}</h2>
      <p className="screen__lede">{r.lede}</p>
      {sections.map((section) => (
        <section key={section.title}>
          <h3 className="screen__section">{section.title}</h3>
          <p className="screen__lede">{section.body}</p>
          <p className="standings__detail">{section.example}</p>
        </section>
      ))}
    </div>
  );
}
