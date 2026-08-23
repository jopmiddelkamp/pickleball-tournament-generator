import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env";
import * as schema from "./schema";

/**
 * One connection pool per process. In development Next reloads modules on
 * every edit, so the pool is parked on globalThis to avoid leaking one per
 * reload. `prepare: false` is required by Supabase's transaction pooler.
 */
const globalForDb = globalThis as unknown as { ptgSql?: ReturnType<typeof postgres> };

const sql = globalForDb.ptgSql ?? postgres(env.POSTGRES_URL, { prepare: false });
if (process.env.NODE_ENV !== "production") globalForDb.ptgSql = sql;

export const db = drizzle({ client: sql, schema });
export type Db = typeof db;
