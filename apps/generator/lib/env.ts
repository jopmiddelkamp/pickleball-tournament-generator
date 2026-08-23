/**
 * Server-side configuration. Read lazily so `next build` (which may run
 * without a database) does not fail at import time; a missing variable fails
 * the first request that needs it, with the name in the message.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}. For local development run \`pnpm db:env\`.`);
  }
  return value;
}

export const env = {
  get POSTGRES_URL(): string {
    return required("POSTGRES_URL");
  },
  get SUPABASE_URL(): string {
    return required("SUPABASE_URL");
  },
  get SUPABASE_PUBLISHABLE_KEY(): string {
    return required("SUPABASE_PUBLISHABLE_KEY");
  },
};
