# Slices 2+3: Public Registration and Round-by-Round Play Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Players register, cancel and follow the evening on a public `/t/<slug>` page remembered by a cookie, while the organiser only decides how many courts they host and runs the night round by round to a final scoreboard.

**Architecture:** Same as slice 1 — server components read through the repositories, every write is a validated Server Action, all rules are pure functions. New: a public (unauthenticated) route family under `/t/[slug]` addressed by unguessable slug, a participant cookie, a derived player cap (`maxPlayersFor` in core), and two new organiser-event columns (`rounds_started`, `finished_at`) that extend the derived status to `live` and `finished`.

**Tech Stack:** unchanged (Next.js 16 App Router, React 19, Drizzle + postgres, Supabase Auth via @supabase/ssr, Vitest, local Supabase stack in Docker).

**Spec:** `docs/superpowers/specs/2026-08-23-registration-and-organiser-accounts-design.md` — the base design PLUS its "Amendment — 2026-08-24" section, which wins where they differ. Read both.

## Global Constraints

- `packages/core` stays pure; it gains exactly one function, `maxPlayersFor(courts) = 6 × courts` (constant `PLAYERS_PER_COURT = 6`).
- Never store derived values. The player cap is derived from `max_courts`; the `max_players` column is dropped. `rounds_started` and `finished_at` are organiser events (source data), not derived.
- Status chain, derived: `open` → `closed` → `generated` → `live` (schedule non-null and `rounds_started > 0`) → `finished` (`finished_at` set). The roster-freeze predicate stays `schedule != null`.
- FIFO waiting list unchanged: `partitionRegistrations(active, maxPlayersFor(maxCourts))`.
- Participant cookie `ptg_participant`: random token from `newParticipantToken()`, `HttpOnly; Secure (production); SameSite=Lax; Path=/; Max-Age 1 year`. Never signed, only looked up. One active registration per (tournament, token) — the partial unique index enforces it.
- The public page never exposes another organiser's data beyond what a visitor must see; tournament uuid ids never appear in public URLs or payloads (the slug does). The seed and algorithm id do not appear on the public page.
- SPEC-1 §5 on everything public: no worst-player callouts, no lowest-score highlights, no skill tiers next to names. The same-gender band badge on court cards is allowed (it is part of the spec's court card).
- Every user-facing string exists in all six catalogs (`en, zh, vi, ja, ko, es`) with identical keys and arities; `test/i18n.test.ts` enforces it.
- Server-side validation on every action input; public actions re-check state (open/closed/frozen/full) server-side. Registration cap guard: `LIMITS.maxRegistrations` (150) active registrations per tournament.
- Determinism untouched: the seed still flows stored → shown → core.
- New env vars (none expected) must be added to `turbo.json` `globalEnv` or Vercel builds strip them.
- `pnpm test && pnpm typecheck && pnpm lint && pnpm --filter @ptg/generator build` green before every commit. Commit style: imperative, no prefix.
- Local stack: `pnpm db:start` runs it; `pnpm db:reset` rebuilds; dev login `dev@example.com` / `password`. A dev server may already be running on :3000 — reuse it, never kill it.

## File structure

```
packages/core/src/maxPlayers.ts                 maxPlayersFor + PLAYERS_PER_COURT
packages/core/test/maxPlayers.test.ts

apps/generator/drizzle/0001_*.sql               drop max_players; add rounds_started, finished_at
apps/generator/lib/db/schema.ts                 columns updated
apps/generator/lib/db/tournaments.ts            findTournamentBySlug; createTournament defaults
apps/generator/lib/db/registrations.ts          findActiveRegistrationByToken
apps/generator/lib/tournament.ts                status live/finished; view roundsStarted/maxPlayers derived
apps/generator/lib/validate.ts                  TournamentInput = { name, startsAt, maxCourts }
apps/generator/lib/public.ts                    PublicView + buildPublicView (pure)
apps/generator/lib/actions/tournaments.ts       startRoundAction, endEveningAction; discard resets; reroll guard
apps/generator/lib/actions/public.ts            registerAction, cancelMyRegistrationAction
apps/generator/lib/actions/publicState.ts       PublicFormState
apps/generator/scripts/seed.ts                  new inputs; one live evening
apps/generator/app/t/[slug]/page.tsx            public page (server)
apps/generator/components/PublicTournament.tsx  public states + tabs (client)
apps/generator/components/PublicRegisterForm.tsx
apps/generator/components/RoundView.tsx         read-only round: your match + court cards + resting
apps/generator/components/NewTournamentForm.tsx name/date/courts only
apps/generator/components/ScheduleScreen.tsx    start-round / end-evening flow
apps/generator/components/TournamentWorkspace.tsx  wiring
apps/generator/test/maxPlayers → in core; tournament/public/validate tests updated
```

---

### Task 1: `maxPlayersFor` in core

**Files:**
- Create: `packages/core/src/maxPlayers.ts`, `packages/core/test/maxPlayers.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Produces: `PLAYERS_PER_COURT = 6` and `maxPlayersFor(courts: number): number` exported from `@ptg/core`.

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/test/maxPlayers.test.ts
import { describe, expect, it } from "vitest";
import { PLAYERS_PER_COURT, maxPlayersFor } from "../src/maxPlayers.js";

describe("maxPlayersFor", () => {
  it.each([
    [1, 6],
    [2, 12],
    [4, 24],
    [6, 36],
  ])("%i courts hold %i players", (courts, cap) => {
    expect(maxPlayersFor(courts)).toBe(cap);
  });
  it("is defensive about junk input", () => {
    expect(maxPlayersFor(0)).toBe(0);
    expect(maxPlayersFor(-2)).toBe(0);
    expect(maxPlayersFor(2.9)).toBe(12);
  });
  it("exposes the constant so the UI can explain the rule", () => {
    expect(PLAYERS_PER_COURT).toBe(6);
  });
});
```

- [ ] **Step 2: Run to verify failure** — `pnpm --filter @ptg/core exec vitest run test/maxPlayers.test.ts`, expect module-not-found.

- [ ] **Step 3: Implement**

```ts
// packages/core/src/maxPlayers.ts
/**
 * How many players one evening can confirm, from the courts alone: four on
 * court and two resting per court, so everyone plays at least about two
 * thirds of the rounds. Registrations beyond this join the waiting list
 * (design amendment 2026-08-24). The constant is the only tuning knob.
 */
export const PLAYERS_PER_COURT = 6;

export function maxPlayersFor(courts: number): number {
  return PLAYERS_PER_COURT * Math.max(0, Math.trunc(courts));
}
```

Add `export * from "./maxPlayers.js";` to `packages/core/src/index.ts` next to the `suggestConfig` export.

- [ ] **Step 4: Verify** — `pnpm --filter @ptg/core test && pnpm --filter @ptg/core typecheck && pnpm --filter @ptg/core lint`, all PASS.

- [ ] **Step 5: Commit** — `git add packages/core && git commit -m "Add maxPlayersFor to core"`

---

### Task 2: Schema migration, extended status, derived cap

**Files:**
- Modify: `apps/generator/lib/db/schema.ts`, `apps/generator/lib/db/tournaments.ts`, `apps/generator/lib/tournament.ts`, `apps/generator/lib/validate.ts`, `apps/generator/scripts/seed.ts`, `apps/generator/test/tournament.test.ts`, `apps/generator/test/validate.test.ts`, `apps/generator/test/db/repositories.test.ts`, `apps/generator/app/organiser/(authed)/page.tsx`
- Create: `apps/generator/drizzle/0001_<name>.sql` (generated)

**Interfaces:**
- `tournaments` loses `maxPlayers`; gains `roundsStarted: integer("rounds_started").notNull().default(0)` and `finishedAt: timestamp("finished_at", { withTimezone: true })`.
- `TournamentStatus = "open" | "closed" | "generated" | "live" | "finished"`; `tournamentStatus(t: { registrationClosedAt: Date | null; schedule: unknown | null; roundsStarted: number; finishedAt: Date | null })`.
- `TournamentInput = { name: string; startsAt: Date; maxCourts: number }` (`parseTournamentForm` drops the other fields; `maxPlayers`/`rounds`/`gameTarget` no longer parsed).
- `createTournament` fills `rounds: 6`, `gameTarget: DEFAULT_GAME_TARGET` (from core).
- `WorkspaceView` gains `roundsStarted: number`; `maxPlayers` stays a field but is computed as `maxPlayersFor(tournament.maxCourts)`.
- `TournamentPatch` gains `roundsStarted` and `finishedAt` (they are columns in `NewTournament`, so the `Pick` list just adds them).

- [ ] **Step 1: Failing tests first.** Update `test/tournament.test.ts`:
  - `tournamentStatus` cases: `{closed, schedule, roundsStarted: 0, finishedAt: null}` → `"generated"`; `roundsStarted: 2` → `"live"`; `finishedAt: new Date()` → `"finished"`; the old open/closed cases with `roundsStarted: 0, finishedAt: null`.
  - The `row()` fixture drops `maxPlayers` and gains `roundsStarted: 0, finishedAt: null`; a new assertion: `buildWorkspaceView` returns `maxPlayers === maxPlayersFor(row.maxCourts)` and `roundsStarted`.
  Update `test/validate.test.ts`: `parseTournamentForm` valid form is `{ name, startsAt, tzOffset, maxCourts }`; forms containing extra fields still parse (extras ignored); rejections keep name/date/courts cases and drop the players/rounds/gameTarget cases.
  Run them; expect failures.

- [ ] **Step 2: Schema + migration.** Edit `lib/db/schema.ts` (drop `maxPlayers`, add the two columns with explicit snake_case names). Run `pnpm db:generate --name round-flow`, inspect the SQL (`ALTER TABLE "tournaments" DROP COLUMN "max_players"`, two `ADD COLUMN`s), then `pnpm db:reset` — expect the seed to FAIL (it still passes `maxPlayers`); that is the next step.

- [ ] **Step 3: Code updates to green.**
  - `lib/validate.ts`: `TournamentInput` and `parseTournamentForm` per the interface above (`maxCourts` still 1–6 via `LIMITS`).
  - `lib/db/tournaments.ts`: `createTournament` values: `rounds: 6, gameTarget: DEFAULT_GAME_TARGET` (import from `@ptg/core`), no `maxPlayers`; extend `TournamentPatch` with `"roundsStarted" | "finishedAt"`.
  - `lib/tournament.ts`: new status function; `buildWorkspaceView` computes `maxPlayers: maxPlayersFor(tournament.maxCourts)` and passes `roundsStarted: tournament.roundsStarted`.
  - `app/organiser/(authed)/page.tsx`: `maxPlayers: maxPlayersFor(t.maxCourts)` for the summary (import from `@ptg/core`).
  - `scripts/seed.ts`: inputs become `{ name, startsAt, maxCourts }`. Open evening: `maxCourts: 2` with all 18 registrations (cap 12 → 6 waiting). Played evening: `maxCourts: 4`, 14 registrations, generated as before AND `roundsStarted: 2` in the same `updateTournament` patch, so the dev data has a live evening.
  - `test/db/repositories.test.ts`: input loses `maxPlayers`/`rounds`/`gameTarget`; assert `created.rounds === 6` and `created.gameTarget === 11`.

- [ ] **Step 4: Verify** — `pnpm db:reset` succeeds end to end; `pnpm test && pnpm typecheck && pnpm lint && pnpm --filter @ptg/generator build` green. `psql`-via-docker: `\d tournaments` shows the new columns and no `max_players`.

- [ ] **Step 5: Commit** — `git add -A apps/generator && git commit -m "Derive the player cap from the courts and track round progress"`

Note: `components/NewTournamentForm.tsx` still renders the removed fields after this task — the action ignores them, and Task 3 removes them. If typecheck breaks on the form (it should not; the form only posts strings), fix minimally and note it.

---

### Task 3: Creation form: name, date, courts — nothing else

**Files:**
- Modify: `apps/generator/components/NewTournamentForm.tsx`, all six `apps/generator/lib/i18n/*.ts`

**Interfaces:**
- Consumes: `maxPlayersFor`, `PLAYERS_PER_COURT` from `@ptg/core`.
- i18n: in the `organiser.form` group REMOVE `maxPlayers`, `maxPlayersHint`, `rounds`, `gameTarget`; ADD `capacity: (courts: number, cap: number) => string` — English: `` (courts, cap) => `${courts} ${courts === 1 ? "court" : "courts"} — up to ${cap} players. Anyone above that joins the waiting list, first come first served.` ``; REPLACE `invalid` English with: `"Check the fields: a name, a date, and 1–6 courts."`

- [ ] **Step 1: Rewrite the form.** Keep the `useActionState` + `tzOffset` machinery exactly as is. Fields: name (text, `maxLength={LIMITS.maxTournamentName}`), startsAt (datetime-local), maxCourts (the segmented 1–6 buttons pattern from `SetupScreen`'s courts control, default 4, held in local `useState` with a hidden input `name="maxCourts"`). Under the courts control show `t.organiser.form.capacity(courts, maxPlayersFor(courts))`, live as the selection changes. Remove the players/rounds/game-target fields.

- [ ] **Step 2: Catalogs.** Apply the i18n changes to `en.ts` and translate in the other five; `pnpm test` (parity) green.

- [ ] **Step 3: Browser check.** On :3000 log in, create an evening with 3 courts; the hint says up to 18; after creation the workspace roster shows "0 of 18 places taken".

- [ ] **Step 4: Verify + commit** — full checks green; `git add -A apps/generator && git commit -m "Ask the organiser for nothing but a name, a date and courts"`

---

### Task 4: The organiser runs the evening round by round

**Files:**
- Modify: `apps/generator/lib/actions/tournaments.ts`, `apps/generator/components/ScheduleScreen.tsx`, `apps/generator/components/TournamentWorkspace.tsx`, all six i18n catalogs
- Test: `apps/generator/test/tournament.test.ts` (status already covered; no new pure logic beyond guards — guards are exercised in Step 4's browser checks)

**Interfaces:**
- New actions, both `Promise<ActionResult>`:
  - `startRoundAction(id: string)` — requires a readable schedule (`view.schedule` non-null), `roundsStarted < schedule.rounds.length`, `finishedAt === null`; patch `{ roundsStarted: roundsStarted + 1 }`; otherwise `fail("state")`.
  - `endEveningAction(id: string)` — requires `roundsStarted > 0` and `finishedAt === null`; patch `{ finishedAt: new Date() }`; otherwise `fail("state")`.
- `discardScheduleAction` patch becomes `{ schedule: null, games: [], roundsStarted: 0, finishedAt: null }`.
- `rerollAction`: when `owner.tournament.roundsStarted > 0` return `fail("state")` (no rescheduling mid-evening); otherwise unchanged.
- `ActionError` gains `"state"` (`lib/actions/result.ts` union + all six `workspace.errors` maps — English: `"That step is not available right now."`).
- `ScheduleScreen` props gain: `roundsStarted: number; finished: boolean; onStartRound: () => void; onEndEvening: () => void`.
- i18n additions (all six): `schedule.startRound: (n: number) => string` (EN: `` `Start round ${n}` ``), `schedule.endEvening: "End the evening"`, `schedule.ended: "The evening is over — final standings are on the standings tab."`, `schedule.notStarted: "Nothing has started yet. Start round 1 when the first games are ready."`, `schedule.currentRound: (n: number) => string` (EN: `` `Round ${n} is on court` ``); `organiser.status` gains `live: "Evening running"` and `finished: "Finished"`.

- [ ] **Step 1: Actions + error variant.** Implement per the interfaces (all through `owned(id)`/`save()` as the existing actions). `"state"` added to `result.ts` and the six catalogs.

- [ ] **Step 2: ScheduleScreen flow.** Initial `roundIndex` state: `Math.max(0, Math.min(roundsStarted - 1, rounds.length - 1))`. Above the round chips render the flow control:
  - `finished` → a `Notice` with `t.schedule.ended`.
  - else `roundsStarted < rounds.length` → accent full-width button `t.schedule.startRound(roundsStarted + 1)` calling `onStartRound` (this is also the "Start round 1" state; when `roundsStarted === 0` additionally show `t.schedule.notStarted` as a `standings__detail` line).
  - else → danger-styled full-width button `t.schedule.endEvening` calling `onEndEvening`.
  Show `t.schedule.currentRound(roundsStarted)` as the heading detail when `roundsStarted > 0 && !finished`. Keep chips, swap and score entry exactly as they are.

- [ ] **Step 3: Wire the workspace.** `TournamentWorkspace` passes `roundsStarted={view.roundsStarted}`, `finished={view.status === "finished"}`, `onStartRound={() => run(() => startRoundAction(view.id))}`, `onEndEvening={() => run(() => endEveningAction(view.id))}`. Initial tab: `view.status === "finished" ? "standings" : view.schedule ? "schedule" : "roster"`.

- [ ] **Step 4: Browser checks** (dev server, seeded live evening "Last Tuesday (played)" has roundsStarted 2 of 5): the schedule tab opens on round 2; the button offers "Start round 3"; starting rounds 3–5 flips the button to "End the evening"; ending it shows the notice and the workspace opens on standings after reload; Discard schedule on a finished evening returns everything to the roster state (roundsStarted 0). Reroll on the live seeded evening (before ending) returns the "state" error message.

- [ ] **Step 5: Verify + commit** — full checks; `git add -A apps/generator && git commit -m "Run the evening round by round"`

---

### Task 5: Public registration at /t/<slug>

**Files:**
- Create: `apps/generator/app/t/[slug]/page.tsx`, `apps/generator/lib/public.ts`, `apps/generator/lib/actions/public.ts`, `apps/generator/lib/actions/publicState.ts`, `apps/generator/components/PublicTournament.tsx`, `apps/generator/components/PublicRegisterForm.tsx`, `apps/generator/test/public.test.ts`
- Modify: `apps/generator/lib/db/tournaments.ts` (`findTournamentBySlug`), `apps/generator/lib/db/registrations.ts` (`findActiveRegistrationByToken`), all six i18n catalogs, `apps/generator/test/db/repositories.test.ts` (cover the two new queries)

**Interfaces:**
- `lib/db/tournaments.ts`: `findTournamentBySlug(slug: string): Promise<TournamentRow | null>` — no organiser scope (public); reject non `[A-Za-z0-9_-]{1,32}` slugs with null before querying.
- `lib/db/registrations.ts`: `findActiveRegistrationByToken(tournamentId: string, token: string): Promise<RegistrationRow | null>` (active = `cancelled_at is null`).
- `lib/public.ts` (pure, unit-tested):

```ts
import type { GameResult, Player, Schedule } from "@ptg/core";
import { maxPlayersFor } from "@ptg/core";
import { LIMITS } from "./config";
import type { TournamentRow } from "./db/schema";
import { partitionRegistrations, toPlayer, type ActiveRegistration } from "./registrations";
import { tournamentStatus, type TournamentStatus } from "./tournament";
import { parseGames, parseSchedule } from "./validate";

export interface PublicYou {
  name: string;
  confirmed: boolean;
  /** 1-based waiting-list position; null when confirmed */
  position: number | null;
  canCancel: boolean;
}

export interface PublicView {
  slug: string;
  name: string;
  startsAt: string; // ISO
  status: TournamentStatus;
  capacity: number;
  confirmedCount: number;
  waitingCount: number;
  /** the visitor's registration, matched by cookie; null when not registered */
  you: PublicYou | null;
  /** id of the visitor's registration, for highlighting their match */
  yourId: string | null;
  /** the hard spam cap is reached; the form is closed even while status is open */
  full: boolean;
  gameTarget: number;
  roundsStarted: number;
  players: Player[]; // confirmed only; empty until generated
  schedule: Schedule | null; // present when status is live or finished (readable)
  games: GameResult[];
}

export function buildPublicView(
  tournament: TournamentRow,
  registrations: readonly ActiveRegistration[],
  registrationId: string | null, // the visitor's active registration id, or null
): PublicView
```

  Behaviour: partition by `maxPlayersFor(maxCourts)`; `you` from `registrationId` (confirmed index or waiting position); `canCancel = tournament.schedule == null`; `full = registrations.length >= LIMITS.maxRegistrations`; schedule/games parsed with the validators against confirmed ids and exposed ONLY when `status` is `"live"` or `"finished"` (a generated-but-not-started schedule stays private so the organiser can still discard/regenerate without players screenshotting a draft); unreadable rows behave as "no schedule". No seed, no algorithm id, no organiser id in the type.
- `lib/actions/publicState.ts`: `interface PublicFormState { error: "invalid" | "closed" | "full" | "already" | "failed" | null }`, `INITIAL_PUBLIC_STATE`.
- `lib/actions/public.ts` (`"use server"`):
  - `registerAction(slug: string, _prev: PublicFormState, formData: FormData): Promise<PublicFormState>` — `findTournamentBySlug` → `notFound()`; `tournamentStatus` must be `"open"` else `{error:"closed"}`; `parsePlayerForm` else `"invalid"`; `countActiveRegistrations >= LIMITS.maxRegistrations` → `"full"`; token = existing `ptg_participant` cookie value (validate `[A-Za-z0-9_-]{1,64}`) or `newParticipantToken()`; `addRegistration(tournament.id, { ...player, participantToken: token })` in a try/catch — a unique-violation (`error.code === "23505"` on the postgres error, or just any throw) → `{error:"already"}`; on success set the cookie (`(await cookies()).set("ptg_participant", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 })`), `revalidatePath(\`/t/\${tournament.slug}\`)`, return `{error:null}`.
  - `cancelMyRegistrationAction(slug: string): Promise<PublicFormState>` — slug → tournament → token cookie → `findActiveRegistrationByToken`; no match → `{error:"failed"}`; `tournament.schedule != null` → `{error:"closed"}` (roster frozen); else `cancelRegistration`, revalidate, `{error:null}`.
- `app/t/[slug]/page.tsx` (server): await `params`; `findTournamentBySlug` or `notFound()`; `listActiveRegistrations`; token from `(await cookies()).get("ptg_participant")?.value ?? null`; `findActiveRegistrationByToken` when token; render `<PublicTournament view={buildPublicView(...)} />`. Export nothing else.
- `PublicTournament` (client): own header (title halves + `LanguageSelect`, no logout), then by state:
  - `you` set → status card: `t.public.youAreIn` or `t.public.waiting(position)`; Cancel button (calls `cancelMyRegistrationAction(view.slug)` via `useTransition`) shown when `you.canCancel`, else `t.public.frozen`.
  - `you` null and status `"open"` and not `full` → `<PublicRegisterForm slug={view.slug} />` plus the counts line `t.public.spots(confirmedCount, capacity, waitingCount)`.
  - status not open / full → `t.public.closed` / `t.public.fullMessage`.
  - Live/finished content arrives in Task 6 — render nothing extra yet.
- `PublicRegisterForm` (client): `useActionState(registerAction.bind(null, slug), INITIAL_PUBLIC_STATE)`; fields identical to the roster form (name, gender segmented, six-tier level buttons — copy the markup pattern from `RosterScreen`, do not import it); error notices from `t.public.errors[...]`; when the confirmed list is full but status open, show `t.public.waitlistWarning` above the submit button.
- i18n group `public` (all six catalogs), English:

```ts
public: {
  startsAt: (when: string) => `Starts ${when}`,
  spots: (confirmed: number, cap: number, waiting: number) =>
    waiting > 0 ? `${confirmed} of ${cap} places taken · ${waiting} waiting` : `${confirmed} of ${cap} places taken`,
  registerHeading: "Play along?",
  registerLede: "Fill in your name once; this phone remembers you.",
  register: "Sign me up",
  waitlistWarning: "The evening is full — you would join the waiting list and move up when someone cancels.",
  youAreIn: "You're in!",
  waiting: (n: number) => `You're number ${n} on the waiting list.`,
  cancel: "Cancel my registration",
  frozen: "The schedule is set. Tell the organiser if you cannot make it.",
  closed: "Registration is closed.",
  fullMessage: "Registration is closed — the evening is completely full.",
  errors: {
    invalid: "Enter a name, and pick how you play and your level.",
    closed: "Registration is closed.",
    full: "The evening is completely full.",
    already: "This phone already has an active registration for this evening.",
    failed: "That did not work. Refresh the page and try again.",
  },
},
```

- [ ] **Step 1: Failing pure tests** — `test/public.test.ts` for `buildPublicView`: confirmed visitor (`you.confirmed`, `position null`), waiting visitor (`position` 1-based), stranger (`you null`), cancel allowed until a schedule exists, schedule hidden while status is `"generated"` but exposed when `roundsStarted > 0`, no `seed` property on the returned object (`expect("seed" in view).toBe(false)`), `full` at the cap. Reuse the `row()` fixture style from `test/tournament.test.ts`.
- [ ] **Step 2: Implement** `lib/public.ts` + the two repository queries (+ their integration-test cases: find-by-slug hit/miss/garbage slug; token lookup active vs cancelled) — green.
- [ ] **Step 3: Actions, page, components, catalogs** per the interfaces.
- [ ] **Step 4: Browser checks** (fresh `pnpm db:reset`): open the open evening's `/t/<slug>` logged OUT (private window): register → "You're in!" and the count ticks up; reload → still recognised (cookie); a 13th registration on the 2-court evening lands on the waiting list with the warning shown beforehand; cancel from a confirmed phone promotes number 1; the live evening's page shows the frozen message for a registered visitor and "closed" for a stranger; a garbage slug 404s; `document.cookie` in the console does NOT show `ptg_participant` (httpOnly).
- [ ] **Step 5: Verify + commit** — full checks; `git add -A apps/generator && git commit -m "Let players register themselves on a public page"`

---

### Task 6: The public live view and final scoreboard

**Files:**
- Create: `apps/generator/components/RoundView.tsx`
- Modify: `apps/generator/components/PublicTournament.tsx`, all six i18n catalogs

**Interfaces:**
- `RoundView` (client): `{ round: Round; players: Player[]; games: GameResult[]; roundNumber: number; highlightId: string | null }` — renders the visitor's summary first when `highlightId` matches: partner and opponents by name (`t.public.yourCourt(court, partner, opp1, opp2)`) or `t.public.youRest`; then the full round as read-only `CourtCard`s (pass `result` from `games`, no handlers, `selectedPlayerId={highlightId}` so their name is visually marked) and the resting line (reuse the bench markup pattern from `ScheduleScreen`).
- `PublicTournament` additions: when `status === "live"`: a two-tab strip (`t.public.tabs.now` / `t.public.tabs.standings` — plain buttons styled like the segmented control, not the organiser TabBar) with `RoundView` for round `roundsStarted` and `StandingsScreen` (existing component: `night={computeNightPoints(players, schedule.rounds, games)}`, `players`, `hasSchedule`). When `status === "finished"`: standings first under a `t.public.finalHeading` heading, with the rounds still browsable below via the same chips pattern if cheap, otherwise omit round browsing. SPEC-1 §5 holds: `StandingsScreen` already complies; add nothing that ranks from the bottom.
- i18n additions to `public` (all six): `tabs: { now: "Now playing", standings: "Standings" }`, `round: (n: number) => \`Round ${n}\``, `yourCourt: (court: number, partner: string, a: string, b: string) => \`Court ${court} — with ${partner}, against ${a} & ${b}\``, `youRest: "You rest this round — back in the next one."`, `finalHeading: "Final standings"`, `notStarted: "The schedule is ready. The first round starts soon."`

- [ ] **Step 1: RoundView** with the interface above; derive the visitor's match by scanning `round.matches` for `highlightId` in either team.
- [ ] **Step 2: PublicTournament states** for live and finished; `generated` (not live) shows the registered/closed card plus `t.public.notStarted`.
- [ ] **Step 3: Catalogs** (all six).
- [ ] **Step 4: Browser checks**: on the seeded live evening, open `/t/<slug>` as a stranger — current round 2 court cards with scores visible, standings tab works; register is closed. As the organiser start rounds to the end and End the evening; the public page shows "Final standings" first. Check one registered phone sees its own match line (register on the open evening, close registration as organiser, generate, start round 1, view as that phone).
- [ ] **Step 5: Verify + commit** — full checks; `git add -A apps/generator && git commit -m "Show players their court, the round and the final standings"`

---

### Task 7: Docs, cloud migration, deploy

**Files:**
- Modify: `README.md`, `CLAUDE.md`
- Operations: cloud migration + production deploy + smoke test.

- [ ] **Step 1: Docs.** README "The generator app": describe both sides in two short paragraphs (organiser: name/date/courts, share link, run rounds, scoreboard; player: register via link, cookie, waiting list, live view). CLAUDE.md `apps/generator` bullet: replace "players will register through a shared link (slice 2)" phrasing with the shipped truth; add to "Easy to get wrong": "The player cap is `maxPlayersFor(maxCourts)` from core (6 per court), never stored." Commit: "Document the public registration flow".
- [ ] **Step 2: Cloud migration** — `pnpm db:migrate:cloud` (uses `.env.cloud.local`; refresh it first with `vercel env pull --environment production apps/generator/.env.cloud.local` from `apps/generator` if it errors). Expect `0001` applied.
- [ ] **Step 3: Deploy** — `vercel deploy --prod --yes` from the repo root; expect READY.
- [ ] **Step 4: Smoke test** production: `/t/does-not-exist` → 404; create a real evening via the UI, open its `/t/<slug>` in a private window, register, see the count move; check CSP headers on `/t/<slug>`; Supabase Data API still returns `[]` for both tables.
- [ ] **Step 5: Push** — `git push` (CI green).

---

## Self-review notes

- Amendment coverage: derived cap (T1/T2/T3), round flow columns + status (T2), start/end actions + UI (T4), public registration incl. cookie/FIFO/cancel (T5), live view + final board (T6), deploy (T7). Creation form simplification (T3). Discard resets round progress (T4).
- Type consistency: `TournamentStatus` union extended once in `lib/tournament.ts` and consumed by `TournamentList`, `buildPublicView`, `PublicTournament`; `ActionError` gains `"state"` once in `result.ts`; `PublicFormState` lives in `publicState.ts` (no `"use server"` constant exports); `buildPublicView` consumes the same `ActiveRegistration`/validator seams as `buildWorkspaceView`.
- `organiser.status` map gains `live`/`finished` in the same task (T4) that makes those statuses reachable, so `TournamentList`'s `t.organiser.status[tournament.status]` never misses a key at runtime; the `Messages` type enforces the other five catalogs.
