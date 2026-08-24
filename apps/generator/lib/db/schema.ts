import { sql } from "drizzle-orm";
import { bigint, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

/**
 * Source data only. Status, confirmed-vs-waiting and the effective config are
 * derived in lib/tournament.ts and lib/registrations.ts, never stored.
 *
 * RLS is enabled with no policies: Supabase exposes `public` through its Data
 * API to anyone with the publishable key, and this makes that API return
 * nothing. The app reaches Postgres as `postgres`, which bypasses RLS.
 */
export const tournaments = pgTable(
  "tournaments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Supabase auth user id; every organiser query filters on it */
    organiserId: uuid("organiser_id").notNull(),
    /** public, shareable id used in /t/<slug> */
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    maxCourts: integer("max_courts").notNull(),
    /** confirmed spots per court (playing + resting); capacity is derived from it */
    playersPerCourt: integer("players_per_court").notNull().default(5),
    rounds: integer("rounds").notNull(),
    gameTarget: integer("game_target").notNull(),
    algorithmId: text("algorithm_id").notNull(),
    /** uint32, so it does not fit int4 */
    seed: bigint("seed", { mode: "number" }).notNull(),
    /** organiser override; null means use suggestConfig */
    courts: integer("courts"),
    restSlots: integer("rest_slots"),
    registrationClosedAt: timestamp("registration_closed_at", { withTimezone: true }),
    /** how many rounds the organiser has advanced past on the night screen */
    roundsStarted: integer("rounds_started").notNull().default(0),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    /** core Schedule as JSON; validated on read by lib/validate.ts */
    schedule: jsonb("schedule").$type<unknown>(),
    /** GameResult[] as JSON; validated on read */
    games: jsonb("games").$type<unknown>().notNull().default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("tournaments_organiser_idx").on(t.organiserId, t.createdAt)],
).enableRLS();

export const registrations = pgTable(
  "registrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    /** value of the player's cookie; null for walk-ins added by the organiser */
    participantToken: text("participant_token"),
    name: text("name").notNull(),
    gender: text("gender").$type<"M" | "F">().notNull(),
    level: integer("level").notNull(),
    registeredAt: timestamp("registered_at", { withTimezone: true }).notNull().defaultNow(),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  },
  (t) => [
    index("registrations_tournament_idx").on(t.tournamentId, t.registeredAt),
    uniqueIndex("registrations_active_token_idx")
      .on(t.tournamentId, t.participantToken)
      .where(sql`cancelled_at is null and participant_token is not null`),
  ],
).enableRLS();

export type TournamentRow = typeof tournaments.$inferSelect;
export type NewTournament = typeof tournaments.$inferInsert;
export type RegistrationRow = typeof registrations.$inferSelect;
export type NewRegistration = typeof registrations.$inferInsert;
