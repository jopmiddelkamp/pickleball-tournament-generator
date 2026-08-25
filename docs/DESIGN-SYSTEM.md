# Design system

The generator's visual language, structured after Material 3 and dressed in the app's own brand. It is not a Material *look* — nothing here is a Material component — it borrows Material's *architecture*: a reference palette, a semantic role layer on top of it, and component tokens on top of that.

Three files hold it:

| Where | What |
| --- | --- |
| `apps/generator/lib/theme.ts` | Every value, and the code that emits them as CSS custom properties. The source of truth. |
| `apps/generator/app/globals.css` | The stylesheet, written entirely in tokens. |
| `/design` | A living specimen of every token, rendered from `theme.ts` in the browser. |

`apps/generator/test/theme.test.ts` guards the seams. `.claude/rules/design-system.md` is the working guidance.

## The three tiers

**Reference — `palette`.** Four families, each a single hue and saturation at varying lightness. Keys *are* the HSL lightness, so a ramp extends by adding a tone rather than by inventing a colour.

| Family | Hue / sat | Tones |
| --- | --- | --- |
| Court — the playing surface | `hsl(153.5 42.5%)` | 16 `#173A2B`, 22 `#20503B`, 30 `#2C6B4F` |
| Ball — the chartreuse of a pickleball | `hsl(64 71%)` | 53 `#CDD736`, 60 `#DCE64A` |
| Paper — a printed draw sheet | `hsl(74 16%)` | 82 `#D3D7CA`, 88 `#E4E6DC`, 95 `#F3F4EE`, 100 `#FFFFFF` |
| Ink — text | `hsl(150 8%)` | 9 `#151A17`, 37 `#5A635C` |

Outside the ramps: `men #2B5FA8`, `women #A64A78` (categorical, they never shade), `error #9A3324`, `warning #C4762A`.

The ramps were not designed; they were *found*. Converting the app's existing hexes to HSL showed the brand already sat on consistent hues at regular lightness steps. This tier writes that down.

**System — the roles.** What a colour, size or depth is *for*. Components only ever touch this tier. One value often serves several roles: in a light scheme `on-primary`, `surface` and `on-surface-brand` are all paper 95. That is the mechanism working, not a redundancy — a dark scheme reassigns roles without a component knowing.

**Component.** Declared on the component that owns them, derived from the system tier. There are three sets: `--court-line`, `--court-line-soft` and `--court-ring` on `.court` (the markings painted on a real court, and the rule under the same-gender note); `--gender-base` and `--gender-ring` on `.gender`; and `--chip-glyph` on `.chip`.

## Colour roles

| Role | Value | Job |
| --- | --- | --- |
| `--color-primary` | court 30 | Filled buttons, the court surface, and anything chosen: chips, segments, level options, picker days |
| `--color-primary-hover` | court 22 | The same fill under the pointer |
| `--color-primary-strong` | court 22 | Brand text on a light surface: the quiet button's label, the event name |
| `--color-on-primary` | paper 95 | 5.71:1 |
| `--color-secondary` | ball 60 | The accent button, the current tab, the event name's highlighter, and on a court card the player being swapped |
| `--color-secondary-hover` | ball 53 | |
| `--color-on-secondary` | court 16 | 9.22:1 |
| `--color-surface` | paper 95 | The sheet the evening is played off |
| `--color-surface-raised` | paper 100 | Lifted off the sheet: cards, inputs, panels, popovers |
| `--color-surface-sunken` | paper 88 | Recessed: the page behind the sheet, bench chips, quiet hover fills |
| `--color-on-surface` | ink 9 | 15.93:1 |
| `--color-on-surface-variant` | ink 37 | Labels and captions — 5.63:1 |
| `--color-outline` | paper 82 | Borders |
| `--color-surface-brand` | court 16 | The header, tab bar and menu |
| `--color-on-surface-brand` | paper 95 | 11.32:1 |
| `--color-error` | `#9A3324` | 6.61:1 |
| `--color-warning` | `#C4762A` | 3.52:1 — a rule or an icon, never text |
| `--color-focus` | `#2B5FA8` | The keyboard focus ring |
| `--color-men` / `--color-women` | | Gender markers, with `--color-on-men` / `--color-on-women` |
| `--color-shadow` | ink 9 | Tints every elevation |

`--color-focus` shares a value with `--color-men` but not a meaning: a focus ring is not a gender marker, and either may move without the other. Levels never get a colour at all — SPEC-1 §5 keeps them off every screen a player sees.

`--color-warning` is the one role below 4.5:1. It draws the rule down the side of a warning notice and never the words inside it. If warning *text* is ever needed, add a darker tone rather than reusing this one.

## Type scale

Bricolage Grotesque carries the brand voice and is set tight; Public Sans is set for reading. Sixteen roles across five families, sized from what the app already rendered.

| Role | Face | px | Weight | Line | Tracking | Used by |
| --- | --- | --- | --- | --- | --- | --- |
| `display-lg` | display | 34 | 800 | 1.0 | −0.03em | The roster count |
| `display-md` | display | 26 → 30 | 700 | 1.1 | −0.025em | A screen's heading |
| `display-sm` | display | 20 → 22 | 800 | 1.1 | −0.02em | The app's name in the header |
| `headline` | display | 22 | 800 | 1.15 | −0.02em | The event's name |
| `title` | display | 18 | 800 | 1.2 | −0.02em | A section inside a screen |
| `numeral-lg` | display | 19 | 800 | 1.0 | 0 | A player's total |
| `numeral-md` | display | 17 | 800 | 1.0 | 0 | A rank, a game score |
| `body-lg` | body | 16 | 400 | 1.45 | 0 | Body copy and form fields |
| `body-md` | body | 15 | 600 | 1.2 | 0 | A name on court |
| `body-sm` | body | 14 | 400 | 1.45 | 0 | Ledes, notices, menus, empty states |
| `body-xs` | body | 12 | 400 | 1.4 | 0 | Metadata |
| `action-lg` | body | 15 | 700 | 1.2 | 0 | Buttons |
| `action-sm` | body | 13 | 700 | 1.2 | 0 | Compact buttons and choice chips |
| `label` | body | 11 | 600 | 1.2 | 0.12em | Uppercase field labels, navigation |
| `label-strong` | body | 11 | 700 | 1.2 | 0.16em | A court's number, the bench |
| `micro` | body | 10 | 700 | 1.2 | 0.08em | The gender chip, the court's same-gender note |

The `→` sizes grow at the 720px breakpoint via `--text-<role>-size-wide`.

Numerals get their own roles because scores and standings are read as figures, not prose. They are set in the display face and always paired with `font-variant-numeric: tabular-nums` so columns stay aligned.

A role is applied as five properties — family, size, weight, line-height, letter-spacing — always all five. The CSS `font` shorthand would be terser, but it silently resets `font-variant-numeric`, which would break every column of figures in the app the first time someone reordered a declaration. Five explicit properties cannot fail that way.

The one exception is `.gender`: it takes `micro`'s family, size, weight and line-height but sets `letter-spacing: 0`, because tracking adds a gap *after* a single character and pushes it off centre in its 18px circle. A glyph takes no tracking.

## Shape, space, depth, motion

**Shape** — `--radius-sm` 6px for anything rectangular, `--radius-md` 12px for a container that holds other things, `--radius-pill` for anything you tap.

**Space** — 4 / 8 / 14 / 22 / 34, deliberately *not* Material's 4dp grid. The wider steps give a phone screen more air at the same nominal size, and the app is laid out on it.

**Elevation** — three levels, not Material's six, because the app has three depths: flat on the sheet, a panel that opens in place (`--elevation-1`, the date picker), and a layer that floats over everything (`--elevation-2`, the header menu). Both are tinted with `--color-shadow` through `color-mix`, so a dark scheme deepens them for free. Add a level when something needs one.

**On the brand chrome** — the header, tab bar and menu are one dark surface, and everything drawn on them is the same paper at a different strength: `--brand-hairline` 12%, `--brand-hover` 12%, `--brand-fill` 18%, `--brand-fill-hover` 30%, `--brand-outline` 35%, `--brand-text` 72%. Material composites hover and pressed states this way; here the mechanism covers the chrome's borders and secondary text too, because they are the same material.

**Motion** — two durations and one easing (`--easing-standard`, Material 3's standard curve). `--duration-fast` (140ms) is a background settling under a finger; `--duration-slow` (1600ms) is one sweep of the indeterminate progress bar shown while the schedule is drawn, the only thing on a court-side screen anyone waits for.

**Layers** — `--z-tab-bar` 10, `--z-scrim` 19, `--z-menu` 20. Every stacking context in the app is named, so no component invents a number.

**Print** — its own scheme (`--print-surface`, `--print-ink`, `--print-rule`, `--print-fill`), black on white with grey rules. A club printer is not colour managed and the sheet gets read on a bench in bad light, so the draw sheet drops the brand entirely.

## Where this departs from Material 3

- **Roles are named for the job, not the tone.** `surface-raised` / `surface-sunken` instead of `surface-container-lowest` … `-highest`. There are three surfaces, they flip correctly in a dark scheme, and the names say which way is up.
- **Hover is a token, not a state layer.** Material composites a translucent overlay; the brand *darkens* on hover instead, which reads better on the court green and survives being printed. So `--color-primary-hover` holds the resulting value. The state-layer mechanism is still used, but only where a surface genuinely tints — the translucent controls on the brand chrome.
- **The space ramp is not the 4dp grid** (above).
- **Only the tokens with a consumer exist.** No role is defined speculatively. `--radius-lg` was dropped during this work because nothing used it.

## Adding to the system

Add the value to `theme.ts` — a role in `lightScheme`, a style in `typeScale`, a step in `radius`/`space`. `cssVariables` is generated by walking those structures, so emission is automatic. That generation *is* the fix for the bug that started this: `--white` was used eleven times in `globals.css` and never listed in the hand-written emission map, so every card, input and picker panel resolved to transparent and the gender chips lost their white letters. An undefined custom property is legal CSS, so nothing caught it.

`test/theme.test.ts` now closes that from both sides: every property a stylesheet reads is emitted, and every property emitted is read by something.

Prefer an existing role. Add one when the new use would change independently of the old — that is the same test the reuse rules in `.claude/rules/coding-rules.md` apply to domain logic.

## Adding a dark scheme

The structure is in place; the scheme is not. It would take:

1. A `darkScheme` in `theme.ts` with the same role keys and dark values. New tones — court 84/93, ink 55, a near-black paper 8 — extend the existing ramps at their fixed hue and saturation.
2. Emitting it under `:root[data-theme="dark"]` and `@media (prefers-color-scheme: dark)` alongside the light block, and setting `color-scheme` to match.
3. A pass over the two component-token sets and the print scheme, which are keyed off `on-primary` and stay correct, and over `--color-warning`, which needs a lighter tone to hold contrast on a dark surface.

No component CSS should need to change. If some does, a raw value slipped through the role layer.

## What changed when this was built

The brand was preserved; the values moved onto the scale. One real bug and two pieces of dead code were removed, and everything else is a snap of an off-scale value to its nearest role:

- **Fixed:** `--white` (above) — 11 backgrounds and the gender chips' letters.
- **Removed:** the `.app__meta` rule (no markup used it) and `--radius-lg` (nothing consumed it).
- **Snapped:** roster level and tab bar tracking to `label` (0.06em / 0.08em → 0.12em); the tab bar's inactive text 66% → 72%; the picker's month 16 → 18px and its day initials to weight 700; the court badge 0.06em → 0.08em; the menu border 25% → 35% and the header's quiet button border 45% → 35%; the picker's two disabled opacities (0.35, 0.3) to `--opacity-disabled` 0.45; the print round title 17 → 18px; the picker panel's shadow from a green tint to `--color-shadow`; `transition: ease` to the standard easing curve.
- **Replaced:** the same-gender badge, from a ball-yellow pill to a ruled footnote (above); the two non-volley lines, removed; the level options' selected fill, now `--color-primary` like every other choice control.
- **Redrawn:** the gender chip as a lit ball with a ring and a tinted shadow (above), one pixel larger at 18px.
- **Added:** a pickleball as the wordmark's mark, and `Wordmark` in `components/ui.tsx` — the brand's markup had been copied into three headers, and the accent word now has its own class (`.app__titleAccent`) rather than relying on `.app__title span`.
- **Reduced:** 29 inline `style` attributes to 13, all of which are now one-off positional margins expressed in `--space-*`. The rest became `.screen__section`, `.row--split`, `.row--baseline`, `.label--inline`, `.plain-list`, `.tabular`, `.visually-hidden`, `.print__title` and `.print__scoreCell` — the last of which also replaced a `left: -9999px` label with a `clip-path` one that does not break in right-to-left text.

## One green means selected

Every choice control fills with `--color-primary` when it is chosen: the segmented control, the rounds strip, the picker's days and time slots, and the level options. The level options used to fill a tone darker, which made them the only control in the app that disagreed about what "selected" looks like; they now match. `--color-primary-strong` stays as brand text on a light surface — the quiet button's label and the event name.

## The gender chip

The chip is drawn as a small ball — the same object as the logo — rather than a flat disc. A radial highlight sits top-left where light would catch it — deliberately at half strength, so it reads as a curve rather than a gloss — the shadow beneath is tinted with the chip's own blue or plum instead of grey, and a 1.5px ring in `--color-surface-raised` lifts it off the bench and off a card. On the court the ring switches to `--court-ring`, the same paper the net and sideline are painted in, so the chip belongs to the court's family of marks rather than sitting on top of it like a sticker.

The modifiers set one thing, `--gender-base`; the highlight, the shade, the shadow and the letter's hairline are all derived from it with `color-mix`, so the two chips cannot drift apart and a third category would be one line.

## The court card

The card is the thing you look at across a court in bad light, so it earns its own rules.

**Markings.** The net runs down the middle as a dashed line, drawn from `--court-line` and `--court-line-soft`. The two non-volley lines that used to run parallel to it were removed: at card size they read as stray white strokes boxing in the names rather than as a court, and the net alone already says "court". The inset `--court-ring` is the sideline.

**The same-gender note.** When a team is two men or two women, the card says so and adds the band mix — `same gender · low+high`, because a low-and-high pairing is the good version of a forced pair (SPEC-2 C6, SPEC-1 §2). It is drawn as a footnote: sentence case at `micro`, ruled off with a hairline in the court's own marking colour, the same move the bench uses for secondary information.

It is deliberately not a badge. SPEC-1 §5 keeps the night screen free of anything that singles a player out, and a ball-yellow chip beside two people's names is exactly that. Ball yellow also already means one thing on a court card — the player you are about to swap — and a second meaning would have made swap mode ambiguous.

The note is positioned rather than stacked. A note on one team would otherwise push that half's names out of line with the other half's, which makes the two teams stop reading as one game; `.court__side` carries the height for it on both halves so the four names always sit on two lines.
