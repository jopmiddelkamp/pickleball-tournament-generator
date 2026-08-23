import { randomBytes, randomInt } from "node:crypto";

/** 12 URL-safe characters; the shareable id in /t/<slug>. */
export function newSlug(): string {
  return randomBytes(9).toString("base64url");
}

/** The value stored in a player's cookie. Unguessable, never signed, only ever looked up. */
export function newParticipantToken(): string {
  return randomBytes(32).toString("base64url");
}

export function newSeed(): number {
  return randomInt(0, 0x1_0000_0000);
}
