"use client";

import type { Player, Team } from "@ptg/core";
import Link from "next/link";
import { useTournament } from "../../lib/useTournament";

function names(team: Team, playerById: ReadonlyMap<string, Player>): string {
  return team.map((id) => playerById.get(id)?.name ?? id).join(" & ");
}

/**
 * The sheet you tape to the wall. Plain black on white, one table per round,
 * no levels and no scores - just who is where.
 */
export default function PrintPage() {
  const { state } = useTournament();

  if (!state) return <main className="print">Loading…</main>;

  const playerById = new Map(state.players.map((p) => [p.id, p]));
  const rounds = state.schedule?.rounds ?? [];

  return (
    <main className="print">
      <div className="print__hideOnPaper" style={{ marginBottom: 18 }}>
        <Link className="button button--quiet button--small" href="/">
          Back to the app
        </Link>
      </div>

      <h1 className="print__roundTitle" style={{ fontSize: 22 }}>
        Mixed doubles night
      </h1>
      <p className="print__rest" style={{ marginBottom: 18 }}>
        {state.players.length} players · {state.config.courts} courts · {rounds.length} rounds ·
        games to {state.gameTarget} · seed {state.config.seed}
      </p>

      {rounds.length === 0 ? (
        <p>No schedule has been generated yet.</p>
      ) : (
        rounds.map((round, index) => (
          <section key={index} className="print__round">
            <h2 className="print__roundTitle">Round {index + 1}</h2>
            <table className="print__table">
              <thead>
                <tr>
                  <th scope="col">Court</th>
                  <th scope="col">Team</th>
                  <th scope="col">Team</th>
                  <th scope="col">Score</th>
                </tr>
              </thead>
              <tbody>
                {round.matches.map((match) => (
                  <tr key={match.court}>
                    <td>{match.court}</td>
                    <td>{names(match.teamA, playerById)}</td>
                    <td>{names(match.teamB, playerById)}</td>
                    <td style={{ width: 90 }} />
                  </tr>
                ))}
              </tbody>
            </table>
            {round.resting.length > 0 ? (
              <p className="print__rest">
                Resting: {round.resting.map((id) => playerById.get(id)?.name ?? id).join(", ")}
              </p>
            ) : null}
          </section>
        ))
      )}
    </main>
  );
}
