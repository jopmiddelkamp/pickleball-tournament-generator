/**
 * Dev data for the local stack: one open tournament with a full confirmed
 * list plus two waiting, one generated tournament with scores, attached to
 * the organiser who has signed in with Google. Log in once at
 * /organiser/login, then run `pnpm db:seed`; straight after `pnpm db:reset`
 * there is no organiser yet, so the seed politely does nothing.
 *
 * Env comes from `node --env-file=.env.local` in the package script: imports
 * are hoisted, so loading the file inside this module would be too late for
 * lib/db/client.ts.
 */
import { createClient } from "@supabase/supabase-js";
import { generateSchedule, maxPlayersFor, DEFAULT_ALGORITHM_ID, type Gender, type Level } from "@ptg/core";
import { addRegistration, listActiveRegistrations } from "../lib/db/registrations";
import { createTournament, updateTournament } from "../lib/db/tournaments";
import { effectiveConfig } from "../lib/tournament";
import { partitionRegistrations, toPlayer } from "../lib/registrations";
import { withScore } from "../lib/evening";

const NAMES: Array<[string, Gender, Level]> = [
  ["Ana", "F", 3], ["Bram", "M", 4], ["Chloé", "F", 2], ["Daan", "M", 5], ["Eva", "F", 4], ["Finn", "M", 3],
  ["Gwen", "F", 5], ["Hugo", "M", 2], ["Iris", "F", 3], ["Jens", "M", 4], ["Kim", "F", 6], ["Lars", "M", 3],
  ["Mara", "F", 4], ["Noah", "M", 1], ["Olga", "F", 2], ["Pim", "M", 5], ["Quinn", "F", 3], ["Ruben", "M", 4],
];

/** The earliest-created auth user: whoever signed in with Google first. */
async function findOrganiser(): Promise<{ id: string; email: string | undefined } | null> {
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY are required; run `pnpm db:env`.");
  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const listed = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listed.error) throw listed.error;
  const [oldest] = [...listed.data.users].sort((a, b) => a.created_at.localeCompare(b.created_at));
  return oldest ? { id: oldest.id, email: oldest.email } : null;
}

async function main(): Promise<void> {
  const organiser = await findOrganiser();
  if (!organiser) {
    console.log("No organiser yet. Sign in with Google at /organiser/login, then run `pnpm db:seed`.");
    return;
  }
  const organiserId = organiser.id;
  const startsAt = new Date(Date.now() + 3 * 24 * 3600 * 1000);

  const open = await createTournament(organiserId, {
    name: "Friday mix (open)",
    location: "Balanca Pickleball Court",
    startsAt,
    maxCourts: 2,
    playersPerCourt: 5,
    rounds: 6,
    gameTarget: 11,
    roundMinutes: 15,
    algorithmId: DEFAULT_ALGORITHM_ID,
  });
  for (const [name, gender, level] of NAMES) {
    await addRegistration(open.id, { name, gender, level, participantToken: null });
  }

  const generated = await createTournament(organiserId, {
    name: "Last Tuesday (played)",
    location: null,
    startsAt: new Date(Date.now() - 7 * 24 * 3600 * 1000),
    maxCourts: 4,
    playersPerCourt: 5,
    rounds: 6,
    gameTarget: 11,
    roundMinutes: null,
    algorithmId: DEFAULT_ALGORITHM_ID,
  });
  for (const [name, gender, level] of NAMES.slice(0, 14)) {
    await addRegistration(generated.id, { name, gender, level, participantToken: null });
  }
  const active = await listActiveRegistrations(generated.id);
  const players = partitionRegistrations(active, maxPlayersFor(generated.maxCourts, generated.playersPerCourt)).confirmed.map(toPlayer);
  const config = effectiveConfig(generated, players.length);
  const schedule = generateSchedule(DEFAULT_ALGORITHM_ID, players, config);
  let games = [] as ReturnType<typeof withScore>;
  for (const [roundIndex, round] of schedule.rounds.slice(0, 2).entries()) {
    for (const match of round.matches) {
      games = withScore(games, match, roundIndex, "A", 11);
      games = withScore(games, match, roundIndex, "B", 6 + match.court);
    }
  }
  await updateTournament(organiserId, generated.id, {
    registrationClosedAt: new Date(),
    schedule,
    games,
    roundsStarted: 2,
  });

  console.log(`Seeded organiser ${organiser.email ?? organiserId} with tournaments ${open.slug} and ${generated.slug}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
