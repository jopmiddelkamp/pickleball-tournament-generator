/**
 * Postgres reports a violated unique index with SQLSTATE 23505. The `postgres`
 * driver puts that on `error.code`; Drizzle then wraps the driver error in a
 * `DrizzleQueryError` and keeps the original on `error.cause`, so the code has
 * to be looked up through the chain.
 */
export function isUniqueViolation(err: unknown): boolean {
  for (let e: unknown = err; typeof e === "object" && e !== null; e = (e as { cause?: unknown }).cause) {
    if ((e as { code?: unknown }).code === "23505") return true;
  }
  return false;
}
