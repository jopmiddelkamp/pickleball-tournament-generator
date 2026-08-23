// Vitest setup file: loads .env.local so integration tests can reach the local
// stack. No file means POSTGRES_URL stays unset and those tests skip.
try {
  process.loadEnvFile(".env.local");
} catch {
  // no local env: integration tests skip themselves
}
