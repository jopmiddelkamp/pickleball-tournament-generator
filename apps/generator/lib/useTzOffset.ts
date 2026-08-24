"use client";

import { useSyncExternalStore } from "react";

function noopSubscribe(): () => void {
  return () => {};
}

function getTzOffset(): number {
  return new Date().getTimezoneOffset();
}

function getServerTzOffset(): number {
  return 0;
}

/**
 * The browser's zone, so "19:30" means 19:30 where the organiser is. The
 * server renders 0 (UTC); the client snapshot corrects it after mount, so SSR
 * and the hydrated markup agree before the correction lands.
 */
export function useTzOffset(): number {
  return useSyncExternalStore(noopSubscribe, getTzOffset, getServerTzOffset);
}
