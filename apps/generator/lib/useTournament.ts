"use client";

import { useSyncExternalStore } from "react";
import {
  dismissNotice,
  getServerSnapshot,
  getSnapshot,
  setTournament,
  startNewEvening,
  subscribe,
  updateTournament,
  type StoreSnapshot,
} from "./store";

export interface Tournament extends StoreSnapshot {
  update: typeof updateTournament;
  replace: typeof setTournament;
  startOver: typeof startNewEvening;
  dismissNotice: typeof dismissNotice;
}

export function useTournament(): Tournament {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    ...snapshot,
    update: updateTournament,
    replace: setTournament,
    startOver: startNewEvening,
    dismissNotice,
  };
}
