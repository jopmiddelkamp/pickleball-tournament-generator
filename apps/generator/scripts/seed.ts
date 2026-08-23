/**
 * Dev data for the local stack: one organiser, one open tournament with a
 * full confirmed list plus two waiting, one generated tournament with scores.
 * Idempotent for the organiser; tournaments are added each run, so run it
 * after `supabase db reset` (that is what `pnpm db:reset` does).
 *
 * Env comes from `node --env-file=.env.local` in the package script: imports
 * are hoisted, so loading the file inside this module would be too late for
 * lib/db/client.ts.
 */
import { createClient } from "@supabase/supabase-js";
import { generateSchedule, DEFAULT_ALGORITHM_ID, type Gender, type Level } from "@ptg/core";
import { addRegistration, listActiveRegistrations } from "../lib/db/registrations";
import { createTournament, updateTournament } from "../lib/db/tournaments";
import { effectiveConfig } from "../lib/tournament";
import { partitionRegistrations, toPlayer } from "../lib/registrations";
import { withScore } from "../lib/evening";

const EMAIL = "dev@example.com";
const PASSWORD = "password";

const NAMES: Array<[string, Gender, Level]> = [
  ["Ana", "F", 3], ["Bram", "M", 4], ["Chloé", "F", 2], ["Daan", "M", 5], ["Eva", "F", 4], ["Finn", "M", 3],
  ["Gwen", "F", 5], ["Hugo", "M", 2], ["Iris", "F", 3], ["Jens", "M", 4], ["Kim", "F", 6], ["Lars", "M", 3],
  ["Mara", "F", 4], ["Noah", "M", 1], ["Olga", "F", 2], ["Pim", "M", 5], ["Quinn", "F", 3], ["Ruben", "M", 4],
];

async function ensureOrganiser(): Promise<string> {
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY are required; run `pnpm db:env`.");
  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const created = await admin.auth.admin.createUser({ email: EMAIL, password: PASSWORD, email_confirm: true });
  if (created.data.user) return created.data.user.id;
  const listed = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = listed.data.users.find((u) => u.email === EMAIL);
  if (!existing) throw created.error ?? new Error("Could not create or find the dev organiser");
  return existing.id;
}

async function main(): Promise<void> {
  const organiserId = await ensureOrganiser();
  const startsAt = new Date(Date.now() + 3 * 24 * 3600 * 1000);

  const open = await createTournament(organiserId, {
    name: "Friday mix (open)",
    startsAt,
    maxPlayers: 16,
    maxCourts: 4,
    rounds: 6,
    gameTarget: 11,
  });
  for (const [name, gender, level] of NAMES) {
    await addRegistration(open.id, { name, gender, level, participantToken: null });
  }

  const generated = await createTournament(organiserId, {
    name: "Last Tuesday (played)",
    startsAt: new Date(Date.now() - 7 * 24 * 3600 * 1000),
    maxPlayers: 16,
    maxCourts: 4,
    rounds: 5,
    gameTarget: 11,
  });
  for (const [name, gender, level] of NAMES.slice(0, 14)) {
    await addRegistration(generated.id, { name, gender, level, participantToken: null });
  }
  const active = await listActiveRegistrations(generated.id);
  const players = partitionRegistrations(active, generated.maxPlayers).confirmed.map(toPlayer);
  const config = effectiveConfig(generated, players.length);
  const schedule = generateSchedule(DEFAULT_ALGORITHM_ID, players, config);
  let games = [] as ReturnType<typeof withScore>;
  for (const [roundIndex, round] of schedule.rounds.slice(0, 2).entries()) {
    for (const match of round.matches) {
      games = withScore(games, match, roundIndex, "A", 11);
      games = withScore(games, match, roundIndex, "B", 6 + match.court);
    }
  }
  await updateTournament(organiserId, generated.id, { registrationClosedAt: new Date(), schedule, games });

  console.log(`Seeded organiser ${EMAIL} / ${PASSWORD} with tournaments ${open.slug} and ${generated.slug}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
