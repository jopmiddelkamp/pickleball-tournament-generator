"use client";

import type { Player } from "@ptg/core";
import { useLocale } from "../lib/i18n/useLocale";
import { EmptyState, GenderChip, Notice } from "./ui";

export function RosterScreen({
  confirmed,
  waiting,
  maxPlayers,
  guestHosts,
  registrationOpen,
  frozen,
  canStart,
  canGoBack,
  onRemove,
  onStart,
  onBackToRegistration,
}: {
  confirmed: Player[];
  waiting: Player[];
  maxPlayers: number;
  /** registration id of a +1 -> name of who brought them */
  guestHosts: Record<string, string>;
  registrationOpen: boolean;
  frozen: boolean;
  /** at least four confirmed players */
  canStart: boolean;
  /** nothing played yet, so the draw can be dropped */
  canGoBack: boolean;
  onRemove: (playerId: string) => void;
  onStart: () => void;
  onBackToRegistration: () => void;
}) {
  const { t } = useLocale();
  const men = confirmed.filter((p) => p.gender === "M").length;

  function guestTag(id: string): React.ReactNode {
    const host = guestHosts[id];
    return host ? <span className="roster__level"> · {t.roster.guestOf(host)}</span> : null;
  }

  return (
    <div>
      <h2 className="screen__heading">{t.roster.heading}</h2>
      <p className="screen__lede">{t.roster.lede}</p>

      {frozen ? <Notice tone="warn">{t.roster.frozen}</Notice> : null}

      <div className="row row--split" style={{ margin: "var(--space-lg) 0 var(--space-sm)" }}>
        <span className="roster__countLabel">{registrationOpen ? t.roster.registrationOpen : t.roster.registrationClosed}</span>
        {registrationOpen ? (
          <button type="button" className="button button--accent button--small" disabled={!canStart} onClick={onStart}>
            {t.roster.startEvent}
          </button>
        ) : (
          <button type="button" className="button button--quiet button--small" disabled={!canGoBack} onClick={onBackToRegistration}>
            {t.roster.backToRegistration}
          </button>
        )}
      </div>
      {registrationOpen && !canStart ? <p className="standings__detail">{t.setup.needPlayers}</p> : null}
      <div className="roster__count">{confirmed.length}</div>
      <div className="roster__countLabel">
        {t.roster.confirmedCount(confirmed.length, maxPlayers)} · {t.roster.count(confirmed.length, men, confirmed.length - men)}
      </div>

      {confirmed.length === 0 ? (
        <EmptyState>{t.roster.empty}</EmptyState>
      ) : (
        <ul className="roster__list">
          {confirmed.map((player) => (
            <li key={player.id} className="roster__item">
              <GenderChip gender={player.gender} />
              <span className="roster__name">
                {player.name}
                {guestTag(player.id)}
              </span>
              <span className="roster__level">{t.levels[player.level]}</span>
              <button
                type="button"
                className="button button--quiet button--small"
                disabled={frozen}
                onClick={() => onRemove(player.id)}
              >
                {t.roster.remove}
              </button>
            </li>
          ))}
        </ul>
      )}

      {waiting.length > 0 ? (
        <>
          <h3 className="screen__section" style={{ marginTop: "var(--space-lg)" }}>
            {t.roster.waitingHeading}
          </h3>
          <ul className="roster__list">
            {waiting.map((player, index) => (
              <li key={player.id} className="roster__item">
                <span className="roster__level">{t.roster.position(index + 1)}</span>
                <GenderChip gender={player.gender} />
                <span className="roster__name">
                  {player.name}
                  {guestTag(player.id)}
                </span>
                <button
                  type="button"
                  className="button button--quiet button--small"
                  disabled={frozen}
                  onClick={() => onRemove(player.id)}
                >
                  {t.roster.remove}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
