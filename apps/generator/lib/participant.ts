/** The cookie a player's phone carries so the public page recognises them again. */
export const PARTICIPANT_COOKIE = "ptg_participant";

/** Shape minted by `newParticipantToken()`; anything else is either garbage or an attempt to inject one. */
export const TOKEN_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

interface ReadonlyCookieStore {
  get(name: string): { value: string } | undefined;
}

/** Reads the participant cookie, returning it only when it matches the shape we ever mint. */
export function readParticipantToken(cookieStore: ReadonlyCookieStore): string | null {
  const value = cookieStore.get(PARTICIPANT_COOKIE)?.value;
  return value && TOKEN_PATTERN.test(value) ? value : null;
}
