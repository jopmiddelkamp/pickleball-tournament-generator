"use client";

import type { Gender, Level } from "@ptg/core";
import { useState } from "react";
import { useLocale } from "../lib/i18n/useLocale";
import type { PlayerProfile } from "../lib/validate";
import { ProfileEditor } from "./ProfileEditor";
import { EmptyState, GenderChip, Notice } from "./ui";

/** One name on the list. The level is only ever present on the organiser's copy (SPEC-1 §5). */
export interface RosterEntry {
  id: string;
  name: string;
  gender: Gender;
  level?: Level;
}

/** What the organiser can do to the list; absent on the public page, where none of it is rendered. */
export interface RosterControls {
  frozen: boolean;
  /** at least four confirmed players */
  canStart: boolean;
  /** nothing played yet, so the draw can be dropped */
  canGoBack: boolean;
  /** the draw is running on the server */
  starting: boolean;
  onRemove: (playerId: string) => void;
  /** corrects a player's gender/level in place; their arrival position stays */
  onEdit: (playerId: string, profile: PlayerProfile) => void;
  onStart: () => void;
  onBackToRegistration: () => void;
}

/**
 * The list of who is playing, in arrival order. The organiser's workspace and
 * the public page render the same screen; only the organiser gets the level
 * column, the editor and the buttons.
 */
export function RosterScreen({
  confirmed,
  waiting,
  maxPlayers,
  guestHosts,
  registrationOpen,
  mine = {},
  controls,
}: {
  confirmed: RosterEntry[];
  waiting: RosterEntry[];
  maxPlayers: number;
  /** registration id of a +1 -> name of who brought them */
  guestHosts: Record<string, string>;
  registrationOpen: boolean;
  /** the visitor's own rows on the public page */
  mine?: Record<string, "you" | "guest">;
  controls?: RosterControls;
}) {
  const { t } = useLocale();
  const [editingId, setEditingId] = useState<string | null>(null);
  const men = confirmed.filter((p) => p.gender === "M").length;

  function tag(entry: RosterEntry): React.ReactNode {
    const own = mine[entry.id];
    if (own) return <span className="roster__you"> · {own === "you" ? t.public.you : t.public.yourGuest}</span>;
    const host = guestHosts[entry.id];
    return host ? <span className="roster__level"> · {t.roster.guestOf(host)}</span> : null;
  }

  function editor(entry: RosterEntry, c: RosterControls): React.ReactNode {
    return (
      <ProfileEditor
        name={entry.name}
        initial={{ gender: entry.gender, level: entry.level ?? 3 }}
        pending={false}
        onSave={(profile) => {
          c.onEdit(entry.id, profile);
          setEditingId(null);
        }}
        onCancel={() => setEditingId(null)}
      />
    );
  }

  function row(entry: RosterEntry, number: number): React.ReactNode {
    if (controls && editingId === entry.id) return <li key={entry.id}>{editor(entry, controls)}</li>;
    return (
      <li key={entry.id} className="roster__item" aria-current={mine[entry.id] ? true : undefined}>
        <span className="standings__rank roster__number">{number}</span>
        <GenderChip gender={entry.gender} />
        <span className="roster__name">
          {entry.name}
          {tag(entry)}
        </span>
        {controls && entry.level !== undefined ? <span className="roster__level">{t.levels[entry.level]}</span> : null}
        {controls ? (
          <>
            <button
              type="button"
              className="button button--quiet button--small"
              disabled={controls.frozen}
              onClick={() => setEditingId(entry.id)}
            >
              {t.roster.edit}
            </button>
            <button
              type="button"
              className="button button--quiet button--small"
              disabled={controls.frozen}
              onClick={() => controls.onRemove(entry.id)}
            >
              {t.roster.remove}
            </button>
          </>
        ) : null}
      </li>
    );
  }

  return (
    <div>
      <h2 className="screen__heading">{t.roster.heading}</h2>
      {controls ? <p className="screen__lede">{t.roster.lede}</p> : null}

      {controls?.frozen ? <Notice tone="warn">{t.roster.frozen}</Notice> : null}

      <div className="row row--split" style={{ margin: "var(--space-lg) 0 var(--space-sm)" }}>
        <span className="roster__countLabel">{registrationOpen ? t.roster.registrationOpen : t.roster.registrationClosed}</span>
        {controls ? (
          registrationOpen ? (
            <button
              type="button"
              className="button button--accent button--small"
              disabled={!controls.canStart || controls.starting}
              aria-busy={controls.starting}
              onClick={controls.onStart}
            >
              {controls.starting ? t.roster.drawing : t.roster.startEvent}
            </button>
          ) : (
            <button
              type="button"
              className="button button--quiet button--small"
              disabled={!controls.canGoBack}
              onClick={controls.onBackToRegistration}
            >
              {t.roster.backToRegistration}
            </button>
          )
        ) : null}
      </div>
      {controls?.starting ? (
        <div className="progress" role="status" aria-live="polite">
          <div className="progress__track" aria-hidden="true">
            <div className="progress__bar" />
          </div>
          <p className="progress__label">{t.roster.drawingDetail}</p>
        </div>
      ) : null}
      {controls && registrationOpen && !controls.canStart ? <p className="standings__detail">{t.setup.needPlayers}</p> : null}
      <div className="roster__count">{confirmed.length}</div>
      <div className="roster__countLabel">
        {t.roster.confirmedCount(confirmed.length, maxPlayers)} · {t.roster.count(confirmed.length, men, confirmed.length - men)}
      </div>

      {confirmed.length === 0 ? (
        <EmptyState>{controls ? t.roster.empty : t.public.nobodyYet}</EmptyState>
      ) : (
        <ul className="roster__list">{confirmed.map((entry, index) => row(entry, index + 1))}</ul>
      )}

      {waiting.length > 0 ? (
        <>
          <h3 className="screen__section" style={{ marginTop: "var(--space-lg)" }}>
            {t.roster.waitingHeading}
          </h3>
          <ul className="roster__list">{waiting.map((entry, index) => row(entry, confirmed.length + index + 1))}</ul>
        </>
      ) : null}
    </div>
  );
}
