"use client";

import type { Player, Team } from "@ptg/core";
import Link from "next/link";
import { useLocale } from "../../lib/i18n/useLocale";
import { useTournament } from "../../lib/useTournament";

function names(team: Team, playerById: ReadonlyMap<string, Player>, joiner: string): string {
  return team.map((id) => playerById.get(id)?.name ?? id).join(joiner);
}

/**
 * The sheet you tape to the wall. Plain black on white, one table per round,
 * no levels and no scores - just who is where.
 */
export default function PrintPage() {
  const { state } = useTournament();
  const { t } = useLocale();

  if (!state) return <main className="print">{t.print.loading}</main>;

  const playerById = new Map(state.players.map((p) => [p.id, p]));
  const rounds = state.schedule?.rounds ?? [];

  return (
    <main className="print">
      <div className="print__hideOnPaper" style={{ marginBottom: 18 }}>
        <Link className="button button--quiet button--small" href="/">
          {t.print.back}
        </Link>
      </div>

      <h1 className="print__roundTitle" style={{ fontSize: 22 }}>
        {t.title[0]} {t.title[1]}
      </h1>
      <p className="print__rest" style={{ marginBottom: 18 }}>
        {t.print.summary(
          state.players.length,
          state.config.courts,
          rounds.length,
          state.gameTarget,
          state.config.seed,
        )}
      </p>

      {rounds.length === 0 ? (
        <p>{t.print.empty}</p>
      ) : (
        rounds.map((round, index) => (
          <section key={index} className="print__round">
            <h2 className="print__roundTitle">{t.print.round(index + 1)}</h2>
            <table className="print__table">
              <thead>
                <tr>
                  <th scope="col">{t.print.court}</th>
                  <th scope="col">{t.print.team}</th>
                  <th scope="col">{t.print.team}</th>
                  <th scope="col">{t.print.score}</th>
                </tr>
              </thead>
              <tbody>
                {round.matches.map((match) => (
                  <tr key={match.court}>
                    <td>{match.court}</td>
                    <td>{names(match.teamA, playerById, t.print.nameJoiner)}</td>
                    <td>{names(match.teamB, playerById, t.print.nameJoiner)}</td>
                    <td style={{ width: 90 }} />
                  </tr>
                ))}
              </tbody>
            </table>
            {round.resting.length > 0 ? (
              <p className="print__rest">
                {t.print.resting}
                {round.resting.map((id) => playerById.get(id)?.name ?? id).join(", ")}
              </p>
            ) : null}
          </section>
        ))
      )}
    </main>
  );
}
