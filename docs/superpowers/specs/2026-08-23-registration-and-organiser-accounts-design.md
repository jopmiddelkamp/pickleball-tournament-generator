# Online registration and organiser accounts

Date: 2026-08-23. Status: approved design, awaiting implementation plan.

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
  cookies). `supabase-js` is not used for data; Row Level Security is not
  relied on. Authorisation is enforced in server code by scoping every
  organiser query to the signed-in organiser's id.

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

## Build order

Three slices. Each gets its own implementation plan and lands in small
commits with `pnpm test`, `pnpm typecheck` and `pnpm lint` green.

1. **Persistence and organiser accounts.** Drizzle schema and first
   migration, Supabase auth with sign-up and login, tournament list and
   create, the existing setup/schedule/standings flow moved onto the
   database, localStorage removed. `suggestConfig` in core.
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
