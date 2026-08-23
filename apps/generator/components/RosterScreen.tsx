"use client";

import { LEVEL_NAMES, type Gender, type Level, type Player } from "@ptg/core";
import { useState } from "react";
import { LIMITS } from "../lib/state";
import { EmptyState, GenderChip } from "./ui";

const LEVELS: Level[] = [1, 2, 3, 4, 5, 6];

export function RosterScreen({
  players,
  onAdd,
  onRemove,
}: {
  players: Player[];
  onAdd: (player: Omit<Player, "id">) => void;
  onRemove: (playerId: string) => void;
}) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("F");
  const [level, setLevel] = useState<Level>(3);

  const trimmed = name.trim();
  const full = players.length >= LIMITS.maxPlayers;
  const canAdd = trimmed.length > 0 && !full;

  const men = players.filter((p) => p.gender === "M").length;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canAdd) return;
    onAdd({ name: trimmed.slice(0, LIMITS.maxNameLength), gender, level });
    setName("");
    // Most clubs enter alternating genders; flipping saves a tap.
    setGender(gender === "F" ? "M" : "F");
  }

  return (
    <div>
      <h2 className="screen__heading">Who is playing?</h2>
      <p className="screen__lede">
        Levels are the tier people picked at registration. They stay on this screen — nobody sees them
        next to a name during the evening.
      </p>

      <form className="card stack" onSubmit={submit}>
        <div>
          <label className="label" htmlFor="player-name">
            Name
          </label>
          <input
            id="player-name"
            className="input"
            value={name}
            maxLength={LIMITS.maxNameLength}
            autoComplete="off"
            placeholder="Add a player"
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div>
          <span className="label" id="gender-label">
            Plays as
          </span>
          <div className="segmented" role="group" aria-labelledby="gender-label">
            {(["F", "M"] as const).map((option) => (
              <button
                key={option}
                type="button"
                className="segmented__option"
                aria-pressed={gender === option}
                onClick={() => setGender(option)}
              >
                {option === "F" ? "Woman" : "Man"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="label" id="level-label">
            Level
          </span>
          <div className="levels" role="group" aria-labelledby="level-label">
            {LEVELS.map((option) => (
              <button
                key={option}
                type="button"
                className="levels__option"
                aria-pressed={level === option}
                onClick={() => setLevel(option)}
              >
                {LEVEL_NAMES[option]}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="button button--full" disabled={!canAdd}>
          Add player
        </button>
        {full ? <p className="standings__detail">The roster is full at {LIMITS.maxPlayers} players.</p> : null}
      </form>

      <div className="row" style={{ justifyContent: "space-between", margin: "22px 0 8px" }}>
        <div>
          <div className="roster__count">{players.length}</div>
          <div className="roster__countLabel">
            {players.length === 1 ? "player" : "players"} · {men} m · {players.length - men} w
          </div>
        </div>
      </div>

      {players.length === 0 ? (
        <EmptyState>No one on the list yet. Add the first player above.</EmptyState>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {players.map((player) => (
            <li key={player.id} className="roster__item">
              <GenderChip gender={player.gender} />
              <span className="roster__name">{player.name}</span>
              <span className="roster__level">{LEVEL_NAMES[player.level]}</span>
              <button
                type="button"
                className="button button--quiet button--small"
                onClick={() => onRemove(player.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
