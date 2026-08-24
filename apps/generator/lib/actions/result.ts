export type ActionError = "not-found" | "invalid" | "frozen" | "open" | "players" | "full" | "state";
export type ActionResult = { ok: true } | { ok: false; error: ActionError };

export const OK: ActionResult = { ok: true };

export function fail(error: ActionError): ActionResult {
  return { ok: false, error };
}
