"use client";

import type { Gender, Player } from "@ptg/core";
import { useLocale } from "../lib/i18n/useLocale";

export function GenderChip({ gender }: { gender: Gender }) {
  return (
    <span className={`gender gender--${gender}`} aria-hidden="true">
      {gender}
    </span>
  );
}

/** A name with its gender marker. Never carries a level: SPEC-1 §5. */
export function PlayerName({ player, className }: { player: Player; className?: string }) {
  return (
    <span className={className}>
      <GenderChip gender={player.gender} />
      <span>{player.name}</span>
    </span>
  );
}

export function Notice({
  children,
  tone = "info",
  onDismiss,
}: {
  children: React.ReactNode;
  tone?: "info" | "warn";
  onDismiss?: () => void;
}) {
  const { t } = useLocale();
  return (
    <div className={tone === "warn" ? "notice notice--warn" : "notice"} role="status">
      {children}
      {onDismiss ? (
        <>
          {" "}
          <button type="button" className="button button--quiet button--small" onClick={onDismiss}>
            {t.dismiss}
          </button>
        </>
      ) : null}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="empty">{children}</p>;
}
