# Online registration and organiser accounts

Date: 2026-08-23. Status: approved design, awaiting implementation plan.

Amended 2026-08-24: organiser sign-in is Google OAuth through Supabase, not
email + password. There is no sign-up page and no confirmation email, so no
SMTP provider is needed; the first Google sign-in creates the account. Where
this document says email + password, read Google sign-in.

Amended 2026-08-24 (later the same day): capacity is five per court — four
playing, one resting — so 4 courts confirm 20 players, not 24. Everyone
plays about four fifths of the rounds, matching how the club ran evenings
before. Where this document derives capacity from six per court, read five.

## Goal

An organiser creates a tournament evening and shares one URL in the club's
WhatsApp group. Players open it, fill in their name, gender and level, and
are in. Sign-ups above the organiser's cap go onto a waiting list and move
up, first come first served, when someone cancels. On the evening the
organiser generates the schedule from whoever is confirmed, with courts and
rest slots worked out from the head count, and players follow the rounds and
standings on the same URL.

This replaces the current client-only generator. Everything that used to
live in localStorage lives in a database, because a shared URL needs a
server behind it.

## Decisions already taken

- Organisers sign up themselves on a public page; no invite step.
- Players never log in. A cookie remembers them on their own phone.
- No email to players at all. Organiser sign-up uses Supabase's built-in
  confirmation email, which can be switched off in the Supabase dashboard.
- The local, login-free mode is removed, not kept alongside.
- The public page shows the schedule and standings once they exist.

## Hosting

Vercel runs the Next.js app; page rendering and all server code run as
serverless functions. The database is attached through the Vercel
Marketplace (project → Storage → Supabase), which provisions Supabase and
injects its connection env vars; `vercel env pull` copies them for local
development.

Stack:

- **Supabase** for Postgres and organiser auth (email + password).
- **Drizzle ORM** with the `postgres` driver over Supabase's pooled
  connection string for every query. Schema and migrations live in the repo
  under `apps/generator/db/`.
- **`@supabase/ssr`** only for organiser sessions (it manages the auth
  cookies). `supabase-js` is not used for data. Authorisation is enforced in
  server code by scoping every organiser query to the signed-in organiser's
  id.
- **Row Level Security is on for every table, with no policies.** Supabase
  exposes the `public` schema through its Data API to anyone holding the
  (public) anon key; RLS with no policies makes that API return nothing.
  Our server connection uses the `postgres` role, which bypasses RLS, so
  nothing else changes.

The browser never talks to Supabase or Postgres. All reads happen in server
components and all writes through Server Actions, so the existing
`connect-src 'self'` CSP stays unchanged.

`packages/core` stays pure. It gains one function (see "Auto configuration")
and nothing else.

## Data model

Nothing derived is stored (same rule as SPEC-1 §6). Every status below is
computed from source columns.

### `tournaments`

| column | type | notes |
|---|---|---|
| id | uuid | primary key |
| organiser_id | uuid | Supabase auth user id; every organiser query filters on it |
| slug | text, unique | 12 random URL-safe characters; the shareable id in `/t/<slug>` |
| name | text | 1–80 chars |
| starts_at | timestamptz | shown on the public page |
| max_players | int | 4–64; the confirmed cap |
| max_courts | int | 1–6; what the venue has that evening |
| rounds | int | 1–20 |
| game_target | int | rally points per game, default 11 (SPEC-1 §1) |
| algorithm_id | text | from the core registry, default greedy |
| seed | int | uint32; shown with a reroll button as today |
| courts | int, nullable | organiser override; null means use the suggestion |
| rest_slots | int, nullable | organiser override; null means use the suggestion |
| registration_closed_at | timestamptz, nullable | null while registration is open |
| schedule | jsonb, nullable | the core `Schedule`, player ids are registration ids |
| games | jsonb | `GameResult[]`, default `[]` |
| created_at | timestamptz | |

Derived: `status` is `open` while `registration_closed_at` is null, `closed`
once set, `generated` once `schedule` is non-null.

### `registrations`

| column | type | notes |
|---|---|---|
| id | uuid | primary key; this is the `Player.id` core sees |
| tournament_id | uuid | |
| participant_token | text, nullable | the value in the player's cookie; indexed; null for walk-ins added by the organiser |
| name | text | 1–60 chars |
| gender | text | `M` or `F` |
| level | int | 1–6 |
| registered_at | timestamptz | FIFO order |
| cancelled_at | timestamptz, nullable | null while active |

Constraints: at most one active registration per `(tournament_id,
participant_token)`; at most 150 active registrations per tournament (a
spam guard, enforced in the action).

**Confirmed vs waiting list is derived**, never stored. Active
registrations ordered by `registered_at`: the first `max_players` are
confirmed, the rest are the waiting list, in order. A cancellation promotes
the next person with no write beyond `cancelled_at`. Raising or lowering
`max_players` reshuffles the line the same way. This is one pure function,
`partitionRegistrations(registrations, maxPlayers)`, and it is the only
place the rule lives.

### Organisers

Supabase auth users. No table of our own; `organiser_id` references
`auth.users`.

## Public side — `/t/<slug>`

No login. One page whose content depends on the tournament status and on
whether the visitor's cookie matches an active registration.

**Cookie.** `ptg_participant`: a random 32-byte token, set on first
registration from that browser, `HttpOnly; Secure; SameSite=Lax; Path=/`,
one year. It identifies the device across tournaments, so a returning
player is recognised on every evening they sign up for. It is not signed:
the token is unguessable and only ever looked up, never trusted for claims.

**While open:**
- Tournament name, date, spots taken out of `max_players`, and the length of
  the waiting list.
- Unregistered visitor: form with name, gender toggle, level picker with the
  six named tiers (same UI as the current roster entry). Submitting while
  the confirmed list is full still succeeds and lands on the waiting list;
  the page says so before they submit.
- Registered visitor: "You're in" or "You're number N on the waiting list",
  plus a Cancel button. Cancelling sets `cancelled_at`.

**While closed, no schedule:** same as open, but the form is replaced with
"Registration is closed". Cancel still works, so a confirmed player who
drops out on the day frees the spot for the first in line.

**Once generated:** the roster is frozen. Cancel is replaced with "Tell the
organiser". The page shows the schedule exactly as the organiser's schedule
tab does (rounds, court cards, resting line, same-gender band badge) and the
standings tab from SPEC-1, both read-only. The visitor's own games are
highlighted using the cookie. SPEC-1 §5 applies: no lowest-score callouts,
no skill tiers next to names.

Score entry is organiser-only.

## Organiser side — `/organiser/...`, behind login

- `/organiser/sign-up`, `/organiser/login`: Supabase email + password.
  `/organiser/*` redirects to login when there is no session.
- `/organiser`: the organiser's tournaments, newest first, each with its
  status and a copy-link button for the `/t/<slug>` URL.
- `/organiser/new`: name, date and time, max players, max courts, rounds,
  game target. Slug and seed are generated server-side.
- `/organiser/<id>`: the existing tab layout, rewired to the server.
  - **Players** (was Roster): confirmed list and waiting list, with the
    position shown. Organiser can remove anyone (sets `cancelled_at`) and
    add a walk-in by hand (a registration with no participant token, so it
    never matches a cookie). Open/close registration switch.
  - **Setup**: as today, with courts and rest slots pre-filled from the
    suggestion (below) and editable. Generate is enabled only when
    registration is closed and at least 4 are confirmed. Generate stores
    `schedule`; the reroll button changes the seed and regenerates.
  - **Schedule** and **Standings**: unchanged in behaviour; manual swap and
    score entry write `schedule` and `games` through Server Actions.
  - **Discard schedule**: clears `schedule` and `games`, unfreezing the
    roster. Any roster change after generation goes through this, so a
    schedule never references a player who is no longer there.

Every action re-checks that the tournament belongs to the signed-in
organiser. Tournament ids are uuids and are never the public link.

## Auto configuration

Added to `packages/core` as a pure function with tests:

```
suggestConfig(playerCount, maxCourts) -> { courts, restSlots }
  courts    = min(maxCourts, floor(playerCount / 4))
  restSlots = playerCount - 4 * courts
```

Examples: 18 players, 4 courts → 4 courts, 2 rest; 22 players, 4 courts →
4 courts, 6 rest; 20 players, 5 courts → 5 courts, 0 rest; 7 players →
1 court, 3 rest. Fewer than 4 players gives 0 courts, and the UI refuses to
generate.

The suggestion is computed from the confirmed count whenever the setup tab
renders. The organiser's override (`courts`, `rest_slots` columns) wins
when set; the Setup tab has a "use suggestion" reset that nulls both.
`normaliseConfig` still clamps whatever is used before it reaches core.

## Data flow

Server components read through a small repository module
(`apps/generator/lib/db/tournaments.ts`, `registrations.ts`) and hand plain
objects to the existing client components. Writes are Server Actions in
`apps/generator/lib/actions/`. Each action: validates input with the same
limits `parseState` uses today, checks ownership (organiser) or cookie
match (player), writes, and calls `revalidatePath`.

The `schedule` and `games` JSON columns are parsed on read with the existing
`parseSchedule` / `parseGame` validators, so a row edited by hand or written
by an older build is rejected the same way a corrupt localStorage entry is
today, and the organiser sees a notice rather than a broken page.

`lib/store.ts`, `lib/useTournament.ts` and the localStorage half of
`lib/storage.ts` are removed. The validators in `storage.ts` move to
`lib/validate.ts`.

## Error handling

- Invalid input to an action returns a typed error the form shows inline;
  nothing throws to the user.
- A registration that would exceed 150 active entries is refused with a
  message to contact the organiser.
- Two people registering at the same moment both succeed; FIFO order is
  `registered_at`, set by the database, so the line is consistent.
- Organiser actions on a tournament they do not own return "not found",
  not "forbidden", so ids leak nothing.
- Database unavailability surfaces as Next's error boundary with a retry;
  no partial writes, since every action is a single statement or a
  transaction.

## Security

Follows the repo's owasp skill. Concretely:

- All input validated server-side with hard length and range limits.
- Cookies `HttpOnly; Secure; SameSite=Lax`. Server Actions carry Next's
  origin check; `form-action 'self'` stays in the CSP.
- Per-tournament registration cap; one active registration per cookie per
  tournament.
- Organiser scoping on every query; uuids for private ids; random slugs for
  public ones.
- Secrets only in Vercel env vars; `.env*` stays gitignored.
- Public page output is plain React rendering, so names are escaped.

## Testing

Test-first on the pure parts, which is where the rules are:

- `suggestConfig` in core with the examples above.
- `partitionRegistrations` for cap, order, cancellation promotion and cap
  changes.
- Action input validation (name, gender, level, config ranges).
- Status derivation (`open` / `closed` / `generated`) and the "roster
  frozen" rule.
- Schedule and game validators keep their existing tests.

The repository functions are thin Drizzle queries and are covered by
typecheck and by running the app against the Supabase project; no database
is spun up in unit tests.

## Local development

The whole stack runs on the developer's machine in Docker through the
**Supabase CLI**, so localhost behaves like production, including organiser
sign-up and its confirmation email.

- `supabase init` once, at the repo root, creates `supabase/config.toml`.
  `supabase start` brings up Postgres, Auth, Studio (a database UI) and
  Mailpit (catches the auth emails, so organiser sign-up can be completed
  locally without a real inbox). `supabase status` prints the local URLs
  and keys; they are the same on every machine.
- `apps/generator/.env.local` points at the local stack and is generated
  from a committed `.env.example` holding the standard local values. Cloud
  credentials live only in Vercel; deployments get them injected, and
  nothing on a laptop ever points at the cloud database by default.
- Migrations are owned by Drizzle: `drizzle-kit generate` writes SQL into
  `apps/generator/drizzle/` from the TypeScript schema, and `drizzle-kit
  migrate` applies whatever `DATABASE_URL` points at. Applying to the cloud
  database is one explicit command (`pnpm db:migrate:cloud`) that reads
  `.env.cloud.local`, fetched with `vercel env pull --environment production
  .env.cloud.local`. It is never run by `next build`.
- A seed script (`pnpm db:seed`) creates a known organiser
  (`dev@example.com` / `password`, email pre-confirmed through the admin
  API), one open tournament with a full confirmed list and two on the
  waiting list, and one tournament with a generated schedule and some
  scores. That is enough to open any screen without clicking through
  sign-up first.

Scripts, all at the repo root:

| script | does |
|---|---|
| `pnpm db:start` / `pnpm db:stop` | `supabase start` / `supabase stop` |
| `pnpm db:reset` | `supabase db reset` (drops and recreates the local database), then migrate, then seed: the one command to get back to a known state |
| `pnpm db:migrate` | apply pending Drizzle migrations to `DATABASE_URL` |
| `pnpm db:generate` | write a new migration from a schema change |
| `pnpm db:seed` | load the dev data above |
| `pnpm db:studio` | print the local Studio URL |

Repository functions (the thin Drizzle queries) get integration tests that
run against the local stack when `DATABASE_URL` is set and are skipped
otherwise; CI stays on the pure unit tests.

Prerequisites: Docker Desktop and the Supabase CLI (`brew install
supabase/tap/supabase`). The README gets a "Run it locally" section with
exactly these steps.

## Build order

Three slices. Each gets its own implementation plan and lands in small
commits with `pnpm test`, `pnpm typecheck` and `pnpm lint` green.

1. **Persistence and organiser accounts.** Local stack (`supabase init`,
   env example, db scripts, seed), Drizzle schema and first migration,
   Supabase auth with sign-up and login, tournament list and create, the
   existing setup/schedule/standings flow moved onto the database,
   localStorage removed. `suggestConfig` in core.
2. **Public registration.** `/t/<slug>`, the cookie, FIFO waiting list,
   cancel, the organiser's Players tab with remove, walk-in and
   open/close.
3. **Public schedule and standings.** Read-only schedule and standings on
   `/t/<slug>` once generated, own games highlighted, roster freeze and
   Discard schedule.

## Out of scope

Email or WhatsApp notifications, payments, multiple organisers per
tournament, player accounts, editing a registration after submitting
(cancel and re-register instead), and any change to SPEC-1 or SPEC-2.

## Repo documentation to update in slice 1

`CLAUDE.md` and `README.md` say the generator is client-only with
localStorage and no backend; both get corrected. `BUILD-PROMPT.md` gets a
note that the generator scope was extended by this spec, leaving the
original text intact.

## Amendment — 2026-08-24: courts drive everything, and the evening runs round by round

Decided with the user after slice 1 shipped. Where this section disagrees
with the text above, this section wins.

### The two experiences, end to end

**Organiser.** Creating an evening asks for exactly three things: a name, a
date and time, and how many courts they host. That is all they must ever
decide. They share the `/t/<slug>` link in the group chat and watch the
list fill. On the night: close registration, generate, then run the evening
one round at a time — **Start round 1**, enter the scores as games finish,
**Start round 2**, … and after the last round **End the evening**. Rounds,
game target and algorithm keep living on the Setup tab with sensible
defaults (6 rounds, 11 points, greedy) for organisers who care; nobody has
to touch them.

**Player.** Open the link, enter name, gender and level; the cookie
remembers them. They see "you're in" or "number N on the waiting list", and
can cancel. On the night the same link shows the current round — their
court, their partner, their opponents, or "you rest this round" — plus the
full round layout and the SPEC-1 standings. When the organiser ends the
evening the page becomes the final scoreboard.

### The player cap is derived from the courts

`maxPlayersFor(courts) = 6 × courts` (4 playing + 2 resting per court, so
everyone plays at least about two thirds of the rounds), clamped to the
roster limit of 64. This is one pure function in `packages/core` next to
`suggestConfig`, and the single constant (6) is the only tuning knob.
Registrations beyond the cap join the FIFO waiting list exactly as before.

Consequences:
- The `tournaments.max_players` column is **dropped** (it is now derived —
  the derive-don't-store rule applies). `partitionRegistrations` keeps its
  signature; callers pass `maxPlayersFor(maxCourts)`.
- The creation form loses the max-players, rounds and game-target fields;
  `createTournament` fills rounds = 6 and game target = 11. The form shows
  the derived capacity as a hint ("4 courts → up to 24 players; more join
  the waiting list").

### Round-by-round play is source data

Two new `tournaments` columns, both organiser events (not derived):

| column | type | meaning |
|---|---|---|
| rounds_started | int, not null, default 0 | how many rounds the organiser has started; the current round is the last started one |
| finished_at | timestamptz, nullable | set by "End the evening" |

Derived status extends to: `open` → `closed` → `generated` → `live`
(rounds_started > 0) → `finished` (finished_at set). Starting a round is
only possible up to the schedule's round count and only once generated;
ending the evening only when live. Discarding the schedule resets
`rounds_started` to 0 and clears `finished_at` (the columns are organiser
events about a schedule that no longer exists).

Organiser Schedule tab: the current round is front and centre with its
score entry; a primary button starts the next round; after the last round
it becomes **End the evening**. Earlier rounds stay reachable through the
existing round chips.

### Public page states (`/t/<slug>`, no login)

| state | what the visitor sees |
|---|---|
| open | evening info, spots taken of the derived cap, waiting-list length; form (name, gender toggle, six-tier level picker) or, when the cookie matches, their status + Cancel |
| closed / generated, not live | "Registration is closed" / "Starts at …"; own status; Cancel works until a schedule exists |
| live | current round: own match highlighted (court, partner, opponents) or "you rest this round"; the full round's courts; a standings tab (SPEC-1 §5 applies — fun only) |
| finished | final standings, scoreboard first |

The registration cookie is `ptg_participant` as specced above (httpOnly,
Secure, SameSite=Lax, one year, random token, never signed). Players
refresh the page for updates; no live push in this slice.

### Build order for the remainder

1. Core `maxPlayersFor` + status/schema changes (migration 0001: drop
   `max_players`, add `rounds_started`, `finished_at`) + simplified
   creation form.
2. Organiser round flow (start round, end evening, current-round Schedule
   tab).
3. Public registration (`/t/<slug>` form, cookie, status, cancel).
4. Public live view (current round, own-match highlight, standings, final
   scoreboard).
5. Docs + cloud migration + deploy.
