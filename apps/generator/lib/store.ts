/**
 * The evening, held in one place and backed by localStorage.
 *
 * localStorage is an external system, so the app subscribes to it through
 * `useSyncExternalStore` rather than reading it in an effect: the server
 * snapshot is an empty evening, the browser snapshot is whatever was saved, and
 * React reconciles the two after hydration without a cascading render.
 */
import { serialisableState, type TournamentState } from "./state";
import { emptyState, loadState, saveState, type StorageFailure } from "./storage";

export interface StoreSnapshot {
  /** null until the browser snapshot has been read */
  state: TournamentState | null;
  /** set when a saved evening could not be restored */
  notice: StorageFailure | null;
}

const SERVER_SNAPSHOT: StoreSnapshot = { state: null, notice: null };

let snapshot: StoreSnapshot = SERVER_SNAPSHOT;
let loaded = false;
const listeners = new Set<() => void>();

function newSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

function emit(): void {
  for (const listener of listeners) listener();
}

/** Runs exactly once, on the first browser snapshot read. */
function ensureLoaded(): void {
  if (loaded) return;
  loaded = true;
  const result = loadState();
  snapshot =
    result.status === "loaded"
      ? { state: result.state, notice: null }
      : {
          state: emptyState(newSeed()),
          notice: result.status === "unreadable" ? result.reason : null,
        };
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): StoreSnapshot {
  ensureLoaded();
  return snapshot;
}

export function getServerSnapshot(): StoreSnapshot {
  return SERVER_SNAPSHOT;
}

export function setTournament(next: TournamentState): void {
  snapshot = { state: next, notice: snapshot.notice };
  saveState(next, serialisableState);
  emit();
}

export function updateTournament(change: (previous: TournamentState) => TournamentState): void {
  const previous = getSnapshot().state;
  if (previous) setTournament(change(previous));
}

export function dismissNotice(): void {
  if (snapshot.notice === null) return;
  snapshot = { state: snapshot.state, notice: null };
  emit();
}

/** Wipes the saved evening and starts a fresh one with a new seed. */
export function startNewEvening(): void {
  setTournament(emptyState(newSeed()));
}

export { newSeed };
