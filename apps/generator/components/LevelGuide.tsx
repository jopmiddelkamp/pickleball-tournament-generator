"use client";

import type { Level } from "@ptg/core";
import { useLocale } from "../lib/i18n/useLocale";
import { LanguageSelect } from "./LanguageSelect";
import { Wordmark } from "./ui";

const LEVELS: Level[] = [1, 2, 3, 4, 5, 6];

/** The public explainer behind "Not sure": our six tiers against the 1.0–5.5 scale, in the app's own words. */
export function LevelGuide() {
  const { t } = useLocale();
  const g = t.levelGuide;
  return (
    <main className="app">
      <header className="app__header">
        <h1 className="app__title">
          <Wordmark />
        </h1>
        <LanguageSelect />
      </header>
      <div className="app__main">
        <h2 className="screen__heading">{g.heading}</h2>
        <p className="screen__lede">{g.lede}</p>
        <p className="screen__lede">{g.howToPick}</p>
        <ol className="plain-list guide">
          {LEVELS.map((level) => {
            const tier = g.tiers[level];
            return (
              <li key={level} className="card guide__tier">
                <div className="row row--split row--baseline">
                  <h3 className="guide__name">{t.levels[level]}</h3>
                  <span className="guide__rating">{g.rating(tier.range)}</span>
                </div>
                <p className="guide__summary">{tier.summary}</p>
                <ul className="guide__skills">
                  {tier.skills.map((skill) => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      </div>
    </main>
  );
}
