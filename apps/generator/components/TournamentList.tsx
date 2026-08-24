"use client";

import Link from "next/link";

import { useLocale } from "../lib/i18n/useLocale";
import { CopyEventLink } from "./CopyEventLink";
import type { TournamentStatus } from "../lib/tournament";
import { EmptyState } from "./ui";

export interface TournamentSummary {
  id: string;
  slug: string;
  location: string | null;
  name: string;
  startsAt: string;
  status: TournamentStatus;
  players: number;
  maxPlayers: number;
}

export function TournamentList({ tournaments }: { tournaments: TournamentSummary[] }) {
  const { t, locale } = useLocale();

  return (
    <div>
      <h2 className="screen__heading">{t.organiser.heading}</h2>
      <p className="screen__lede">{t.organiser.lede}</p>
      <Link href="/organiser/event/new" className="button button--accent button--full">{t.organiser.newTournament}</Link>
      {tournaments.length === 0 ? (
        <EmptyState>{t.organiser.empty}</EmptyState>
      ) : (
        <ul style={{ listStyle: "none", margin: "22px 0 0", padding: 0 }} className="stack">
          {tournaments.map((tournament) => (
            <li key={tournament.id} className="card">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong>{tournament.name}</strong>
                <span className="roster__level">{t.organiser.status[tournament.status]}</span>
              </div>
              <p className="standings__detail">
                {new Date(tournament.startsAt).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })} ·{" "}
                {t.organiser.players(tournament.players, tournament.maxPlayers)}
              </p>
              <div className="row" style={{ marginTop: 10 }}>
                <Link href={`/organiser/event/${tournament.id}`} className="button button--small">{t.organiser.open}</Link>
                <CopyEventLink slug={tournament.slug} name={tournament.name} startsAt={tournament.startsAt} location={tournament.location} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
