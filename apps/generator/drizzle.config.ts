import { defineConfig } from "drizzle-kit";

// `ENV_FILE` lets `pnpm db:migrate:cloud` point at the pulled production values.
try {
  process.loadEnvFile(process.env.ENV_FILE ?? ".env.local");
} catch {
  // No env file: `generate` does not need one; `migrate` fails below with a clear message.
}

const url = process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
if (!url && process.argv.includes("migrate")) {
  throw new Error("POSTGRES_URL is not set. Run `pnpm db:env` (local) or set ENV_FILE=.env.cloud.local.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: url ?? "" },
  strict: true,
  verbose: true,
});
