import type { Metadata } from "next";
import {
  elevation,
  layout,
  lightScheme,
  motion,
  onBrand,
  opacity,
  palette,
  printScheme,
  radius,
  space,
  typeScale,
  zIndex,
} from "../../lib/theme";
import { PickleballMark } from "../../components/ui";
import "./design.css";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

/**
 * The design system, rendered from itself.
 *
 * Every swatch is painted with the CSS custom property and labelled with the
 * value imported from lib/theme.ts, so the page cannot drift from the code:
 * if a token changes, the specimen changes with it, and if the two ever
 * disagree the disagreement is visible here first.
 *
 * Public and English-only on purpose: a reference for whoever builds on the
 * app, and nothing on it comes from the database. Not linked from the app.
 */

// --- contrast ---------------------------------------------------------------

const luminance = (hex: string): number => {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [
    number,
    number,
    number,
  ];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** WCAG 2.1 contrast ratio, so every `on-` pairing states its own evidence. */
const contrast = (a: string, b: string): number => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
};

// --- small building blocks --------------------------------------------------

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section className="ds__section" id={id}>
      <h2 className="ds__sectionTitle">{title}</h2>
      {children}
    </section>
  );
}

function Ramp({ name, tones, on }: { name: string; tones: Record<string, string>; on: string }) {
  return (
    <>
      <h3 className="ds__groupTitle">{name}</h3>
      <div className="ds__ramp">
        {Object.entries(tones).map(([tone, hex]) => (
          <div key={tone} className="ds__tone" style={{ background: hex, color: on }}>
            <span className="ds__toneName">
              {name.toLowerCase()} {tone}
            </span>
            <span className="ds__toneHex">{hex}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/** A colour role: the swatch comes from CSS, the hex from TypeScript. */
function Role({ role, hex, pairedWith }: { role: string; hex: string; pairedWith?: string | undefined }) {
  const token = `--color-${role.replace(/[A-Z0-9]+/g, (m) => `-${m.toLowerCase()}`)}`;
  const ratio = pairedWith === undefined ? null : contrast(hex, pairedWith);
  return (
    <div className="ds__swatchRow">
      <span className="ds__swatch" style={{ background: `var(${token})` }} />
      <span className="ds__token">{token}</span>
      <span className="ds__value">{hex}</span>
      {ratio === null ? (
        <span />
      ) : (
        <span className={ratio >= 4.5 ? "ds__pass ds__pass--ok" : "ds__pass ds__pass--low"}>
          {ratio.toFixed(2)}:1 {ratio >= 4.5 ? "AA text" : "graphics only"}
        </span>
      )}
    </div>
  );
}

function ValueRow({ token, value }: { token: string; value: string }) {
  return (
    <div className="ds__swatchRow">
      <span />
      <span className="ds__token">{token}</span>
      <span className="ds__value">{value}</span>
      <span />
    </div>
  );
}

const SECTIONS = [
  ["palette", "Palette"],
  ["colour", "Colour roles"],
  ["type", "Type scale"],
  ["shape", "Shape & space"],
  ["depth", "Elevation & chrome"],
  ["system", "Motion, opacity, layers"],
  ["components", "Components"],
] as const;

/** What each type role is for, shown as the specimen itself. */
const TYPE_SPECIMENS: Record<keyof typeof typeScale, string> = {
  displayLg: "18",
  displayMd: "Tonight's schedule",
  displaySm: "Mixed doubles",
  headline: "Thursday club evening",
  title: "Waiting list",
  numeralLg: "34",
  numeralMd: "11",
  bodyLg: "Everyone plays with a new partner each round.",
  bodyMd: "Nadia Farouk",
  bodySm: "Two players sit out this round.",
  bodyXs: "4 courts · 6 rounds · seed 20482",
  actionLg: "Generate schedule",
  actionSm: "Reroll",
  label: "Court",
  labelStrong: "Sitting out",
  micro: "same gender · low+high",
};

export default function DesignSystemPage() {
  return (
    <main className="ds">
      <header className="ds__masthead">
        <h1 className="ds__title">
          Design <span>system</span>
        </h1>
        <p className="ds__lede">
          Every token in <code>lib/theme.ts</code>, drawn with the CSS custom property it emits and labelled with the
          value it holds. Change a token and this page changes with it.
        </p>
        <nav className="ds__index" aria-label="Sections">
          {SECTIONS.map(([id, title]) => (
            <a key={id} className="ds__indexLink" href={`#${id}`}>
              {title}
            </a>
          ))}
        </nav>
      </header>

      <div className="ds__body">
        <Section id="palette" title="Palette">
          <p className="ds__note">
            The reference tier: four families, each one hue and saturation at varying lightness, so the ramps extend by
            adding a tone rather than by inventing a colour. Keys are HSL lightness. Nothing in the app reaches for
            these directly — they exist to be assigned to a role.
          </p>
          <Ramp name="Court" tones={palette.court} on={palette.paper[95]} />
          <Ramp name="Ball" tones={palette.ball} on={palette.court[16]} />
          <Ramp name="Paper" tones={palette.paper} on={palette.ink[9]} />
          <Ramp name="Ink" tones={palette.ink} on={palette.paper[95]} />

          <h3 className="ds__groupTitle">Outside the ramps</h3>
          <div className="ds__ramp">
            <div className="ds__tone" style={{ background: palette.men, color: palette.paper[100] }}>
              <span className="ds__toneName">men</span>
              <span className="ds__toneHex">{palette.men}</span>
            </div>
            <div className="ds__tone" style={{ background: palette.women, color: palette.paper[100] }}>
              <span className="ds__toneName">women</span>
              <span className="ds__toneHex">{palette.women}</span>
            </div>
            <div className="ds__tone" style={{ background: palette.error, color: palette.paper[100] }}>
              <span className="ds__toneName">error</span>
              <span className="ds__toneHex">{palette.error}</span>
            </div>
            <div className="ds__tone" style={{ background: palette.warning, color: palette.ink[9] }}>
              <span className="ds__toneName">warning</span>
              <span className="ds__toneHex">{palette.warning}</span>
            </div>
          </div>
        </Section>

        <Section id="colour" title="Colour roles">
          <p className="ds__note">
            The system tier: what a colour is <em>for</em>. One value often serves several roles — in a light scheme
            <code> on-primary</code> and <code>surface</code> are both paper 95 — which is the point, because a dark
            scheme reassigns roles without a component knowing. Contrast is measured against the surface each role is
            drawn on.
          </p>

          <h3 className="ds__groupTitle">Brand</h3>
          <div className="ds__grid">
            <Role role="primary" hex={lightScheme.primary} pairedWith={lightScheme.onPrimary} />
            <Role role="primaryHover" hex={lightScheme.primaryHover} pairedWith={lightScheme.onPrimary} />
            <Role role="primaryStrong" hex={lightScheme.primaryStrong} pairedWith={lightScheme.surface} />
            <Role role="onPrimary" hex={lightScheme.onPrimary} />
            <Role role="secondary" hex={lightScheme.secondary} pairedWith={lightScheme.onSecondary} />
            <Role role="secondaryHover" hex={lightScheme.secondaryHover} pairedWith={lightScheme.onSecondary} />
            <Role role="onSecondary" hex={lightScheme.onSecondary} />
            <Role role="surfaceBrand" hex={lightScheme.surfaceBrand} pairedWith={lightScheme.onSurfaceBrand} />
            <Role role="onSurfaceBrand" hex={lightScheme.onSurfaceBrand} />
          </div>

          <h3 className="ds__groupTitle">Surfaces</h3>
          <div className="ds__grid">
            <Role role="surface" hex={lightScheme.surface} pairedWith={lightScheme.onSurface} />
            <Role role="surfaceRaised" hex={lightScheme.surfaceRaised} pairedWith={lightScheme.onSurface} />
            <Role role="surfaceSunken" hex={lightScheme.surfaceSunken} pairedWith={lightScheme.onSurface} />
            <Role role="onSurface" hex={lightScheme.onSurface} />
            <Role role="onSurfaceVariant" hex={lightScheme.onSurfaceVariant} pairedWith={lightScheme.surface} />
            <Role role="outline" hex={lightScheme.outline} />
            <Role role="shadow" hex={lightScheme.shadow} />
          </div>

          <h3 className="ds__groupTitle">Feedback and focus</h3>
          <div className="ds__grid">
            <Role role="error" hex={lightScheme.error} pairedWith={lightScheme.surface} />
            <Role role="warning" hex={lightScheme.warning} pairedWith={lightScheme.surfaceRaised} />
            <Role role="focus" hex={lightScheme.focus} pairedWith={lightScheme.surface} />
          </div>
          <p className="ds__note">
            <code>warning</code> stays below 4.5:1 on a raised surface, so it draws the rule down the side of a warning
            notice and never the words inside it. <code>focus</code> shares a value with <code>men</code> and not a
            meaning: a focus ring is not a gender marker, and either may move without the other.
          </p>

          <h3 className="ds__groupTitle">Gender markers</h3>
          <div className="ds__grid">
            <Role role="men" hex={lightScheme.men} pairedWith={lightScheme.onMen} />
            <Role role="onMen" hex={lightScheme.onMen} />
            <Role role="women" hex={lightScheme.women} pairedWith={lightScheme.onWomen} />
            <Role role="onWomen" hex={lightScheme.onWomen} />
          </div>
          <p className="ds__note">
            These mark gender because mixed doubles is the whole point of the evening. They never mark skill: SPEC-1 §5
            keeps levels off the courts, and the standings spell the level out as a word rather than a colour.
          </p>

          <h3 className="ds__groupTitle">Medals</h3>
          <div className="ds__grid">
            <Role role="medalGold" hex={lightScheme.medalGold} />
            <Role role="medalSilver" hex={lightScheme.medalSilver} />
            <Role role="medalBronze" hex={lightScheme.medalBronze} />
          </div>
          <p className="ds__note">The first three places on the standings. A shared rank shares the medal.</p>

          <h3 className="ds__groupTitle">Print</h3>
          <div className="ds__grid">
            {Object.entries(printScheme).map(([role, hex]) => (
              <div key={role} className="ds__swatchRow">
                <span className="ds__swatch" style={{ background: hex }} />
                <span className="ds__token">{`--print-${role}`}</span>
                <span className="ds__value">{hex}</span>
                <span />
              </div>
            ))}
          </div>
          <p className="ds__note">
            The draw sheet drops the brand entirely. A club printer is not colour managed and the sheet gets read on a
            bench in bad light, so print goes black on white with grey rules.
          </p>
        </Section>

        <Section id="type" title="Type scale">
          <p className="ds__note">
            Bricolage Grotesque carries the brand voice and is set tight; Public Sans is set for reading. Numerals get
            their own roles because scores and standings are read as figures, not prose — they are set in the display
            face and always paired with <code>tabular-nums</code> so columns line up. Apply a role as all five
            properties, never a subset.
          </p>
          {Object.entries(typeScale).map(([role, style]) => {
            const token = `--text-${role.replace(/[A-Z0-9]+/g, (m) => `-${m.toLowerCase()}`)}`;
            return (
              <div key={role} className="ds__typeRow">
                <div className="ds__typeMeta">
                  <span className="ds__token">{token}</span>
                  <span className="ds__value">
                    {style.family} · {style.size}px
                    {"sizeWide" in style ? ` → ${style.sizeWide}px` : ""} · {style.weight} · {style.line} ·{" "}
                    {style.tracking}em
                  </span>
                </div>
                <div
                  className="ds__specimen"
                  style={{
                    fontFamily: `var(${token}-font)`,
                    fontSize: `var(${token}-size)`,
                    fontWeight: `var(${token}-weight)`,
                    lineHeight: `var(${token}-line)`,
                    letterSpacing: `var(${token}-tracking)`,
                    textTransform: role.startsWith("label") || role === "micro" ? "uppercase" : "none",
                  }}
                >
                  {TYPE_SPECIMENS[role as keyof typeof typeScale]}
                </div>
              </div>
            );
          })}
        </Section>

        <Section id="shape" title="Shape & space">
          <h3 className="ds__groupTitle">Shape</h3>
          <div className="ds__tiles">
            {Object.entries(radius).map(([step, value]) => (
              <div key={step} className="ds__tile">
                <span className="ds__shape" style={{ borderRadius: `var(--radius-${step})` }} />
                <span className="ds__token">{`--radius-${step}`}</span>
                <span className="ds__value">{value}</span>
              </div>
            ))}
          </div>
          <p className="ds__note">
            <code>sm</code> is the default for anything rectangular, <code>md</code> for a container that holds other
            things, <code>pill</code> for anything you tap.
          </p>

          <h3 className="ds__groupTitle">Space</h3>
          <div className="ds__grid">
            {Object.entries(space).map(([step, value]) => (
              <div key={step} className="ds__swatchRow">
                <span />
                <span className="ds__token">{`--space-${step}`}</span>
                <span className="ds__spaceBar" style={{ width: `var(--space-${step})` }} />
                <span className="ds__value">{value}</span>
              </div>
            ))}
          </div>
          <p className="ds__note">
            A 4 / 8 / 14 / 22 / 34 ramp, deliberately not Material&apos;s 4dp grid: the wider steps give a phone screen
            more air at the same nominal size, and the app is laid out on it.
          </p>

          <h3 className="ds__groupTitle">Layout</h3>
          <div className="ds__grid">
            <ValueRow token="--max-width" value={layout.maxWidth} />
            <ValueRow token="--max-width-wide" value={layout.maxWidthWide} />
            <ValueRow token="--header-height" value={layout.headerHeight} />
            <ValueRow token="--header-height-wide" value={layout.headerHeightWide} />
            <ValueRow token="--tab-bar-height" value={layout.tabBarHeight} />
            <ValueRow token="layout.wide (media query)" value={layout.wide} />
            <ValueRow token="layout.wider (media query)" value={layout.wider} />
          </div>
        </Section>

        <Section id="depth" title="Elevation & chrome">
          <p className="ds__note">
            Three levels, not Material&apos;s six, because the app has three depths: flat on the sheet, a panel that
            opens in place, and a layer that floats over everything. Add a level when something needs one.
          </p>
          <div className="ds__tiles">
            {Object.entries(elevation).map(([level]) => (
              <div key={level} className="ds__tile">
                <span className="ds__elevation" style={{ boxShadow: `var(--elevation-${level})` }} />
                <span className="ds__token">{`--elevation-${level}`}</span>
              </div>
            ))}
          </div>

          <h3 className="ds__groupTitle">Strengths on the brand chrome</h3>
          <p className="ds__note">
            The header, tab bar and menu are one dark surface, and everything drawn on them is the same paper at a
            different strength. Material composites hover and pressed states this way; here the mechanism covers the
            chrome&apos;s borders and secondary text too, because they are the same material.
          </p>
          <div className="ds__onBrand">
            {Object.entries(onBrand).map(([name, ratio]) => {
              const token = `--brand-${name.replace(/[A-Z0-9]+/g, (m) => `-${m.toLowerCase()}`)}`;
              return (
                <div key={name} className="ds__onBrandRow">
                  <span className="ds__token">
                    {token} <span className="ds__value">{Math.round(ratio * 100)}%</span>
                  </span>
                  <span className="ds__onBrandSample" style={{ background: `var(${token})` }} />
                </div>
              );
            })}
          </div>
        </Section>

        <Section id="system" title="Motion, opacity, layers">
          <div className="ds__grid">
            <ValueRow token="--duration-fast" value={motion.durationFast} />
            <ValueRow token="--duration-slow" value={motion.durationSlow} />
            <ValueRow token="--easing-standard" value={motion.easingStandard} />
            {Object.entries(opacity).map(([name, value]) => (
              <ValueRow key={name} token={`--opacity-${name}`} value={String(value)} />
            ))}
            {Object.entries(zIndex).map(([name, value]) => (
              <ValueRow
                key={name}
                token={`--z-${name.replace(/[A-Z0-9]+/g, (m) => `-${m.toLowerCase()}`)}`}
                value={String(value)}
              />
            ))}
          </div>
          <p className="ds__note">
            One duration and one easing. Everything that moves is a background settling under a finger, and there is
            nothing on a court-side screen worth waiting for. Every stacking context in the app is named here, so no
            component invents a number.
          </p>
        </Section>

        <Section id="components" title="Components">
          <h3 className="ds__groupTitle">Buttons</h3>
          <div className="ds__demo">
            <button type="button" className="button">
              Generate schedule
            </button>
            <button type="button" className="button button--accent">
              Start the evening
            </button>
            <button type="button" className="button button--quiet">
              Reroll
            </button>
            <button type="button" className="button button--danger">
              Delete event
            </button>
            <button type="button" className="button button--small">
              Add player
            </button>
            <button type="button" className="button" disabled>
              Generate schedule
            </button>
          </div>

          <h3 className="ds__groupTitle">Choice</h3>
          <div className="ds__demo">
            <div className="segmented" role="group" aria-label="Courts">
              {[2, 3, 4].map((courts) => (
                <button key={courts} type="button" className="segmented__option" aria-pressed={courts === 3}>
                  {courts}
                </button>
              ))}
            </div>
            <div className="rounds">
              {[1, 2, 3].map((round) => (
                <button key={round} type="button" className="rounds__chip" aria-current={round === 2}>
                  Round {round}
                </button>
              ))}
            </div>
          </div>
          <div className="ds__demo">
            <div className="levels">
              {["Just started", "Getting rallies going", "Comfortable", "Competitive"].map((level, index) => (
                <button key={level} type="button" className="levels__option" aria-pressed={index === 2}>
                  {level}
                </button>
              ))}
            </div>
          </div>

          <h3 className="ds__groupTitle">Fields</h3>
          <div className="ds__demo ds__demo--stacked">
            <div className="stack">
              <div>
                <span className="label">Player name</span>
                <input className="input" defaultValue="Nadia Farouk" readOnly />
              </div>
              <div>
                <span className="label">Courts</span>
                <select className="select" defaultValue="4">
                  <option>3</option>
                  <option>4</option>
                </select>
              </div>
            </div>
          </div>

          <h3 className="ds__groupTitle">Messages</h3>
          <div className="ds__demo ds__demo--stacked">
            <div className="notice" role="status">
              Six rounds fit in the time you have.
            </div>
            <div className="notice notice--warn" role="status">
              Two more women than men signed up, so some rounds pair a same-gender team.
            </div>
            <p className="empty">Nobody has signed up yet. Share the link to fill the evening.</p>
          </div>

          <h3 className="ds__groupTitle">The court</h3>
          <div className="ds__demo ds__demo--stacked">
            {/* The real grid, so the card is the width it is court-side. */}
            <div className="courts">
              <section className="court" aria-label="Court 1">
                <div className="court__label">
                  <span>Court 1</span>
                </div>
                <div className="court__surface">
                  <div className="court__side court__side--left">
                    <span className="court__player">
                      <span className="gender gender--F" aria-hidden="true">
                        F
                      </span>
                      <span>Nadia Farouk</span>
                    </span>
                    <span className="court__player">
                      <span className="gender gender--M" aria-hidden="true">
                        M
                      </span>
                      <span>Rui Almeida</span>
                    </span>
                  </div>
                  <div className="court__side court__side--right">
                    <span className="court__player">
                      <span className="gender gender--M" aria-hidden="true">
                        M
                      </span>
                      <span>Sanne de Vries</span>
                    </span>
                    <span className="court__player">
                      <span className="gender gender--M" aria-hidden="true">
                        M
                      </span>
                      <span>Tom Baptist</span>
                    </span>
                    <span className="court__badge">same gender · low+high</span>
                  </div>
                </div>
                <div className="court__score">
                  <span className="court__scoreValue">11</span>
                  <span className="court__scoreDash" aria-hidden="true">
                    –
                  </span>
                  <span className="court__scoreValue">7</span>
                </div>
              </section>
            </div>
            <div className="bench">
              <p className="bench__title">Sitting out</p>
              <div className="bench__names">
                <span className="bench__name">
                  <span className="gender gender--F" aria-hidden="true">
                    F
                  </span>
                  Priya Nair
                </span>
                <span className="bench__name">
                  <span className="gender gender--M" aria-hidden="true">
                    M
                  </span>
                  Jonas Lind
                </span>
              </div>
            </div>
          </div>

          <h3 className="ds__groupTitle">Standings</h3>
          <div className="ds__demo ds__demo--stacked">
            <ul className="standings__list">
              {[
                ["1", "Nadia Farouk", "F", "34", "5 games · 3 won"],
                ["2", "Rui Almeida", "M", "31", "5 games · 3 won"],
                ["3", "Priya Nair", "F", "29", "4 games · 2 won"],
              ].map(([rank, name, gender, total, detail]) => (
                <li key={rank} className="standings__row">
                  <span className="standings__rank">{rank}</span>
                  <span>
                    <span className="standings__name">
                      <span className={`gender gender--${gender}`} aria-hidden="true">
                        {gender}
                      </span>
                      {name}
                    </span>
                    <span className="standings__detail">{detail}</span>
                  </span>
                  <span className="standings__total">{total}</span>
                </li>
              ))}
            </ul>
          </div>

          <h3 className="ds__groupTitle">The event banner</h3>
          <div className="ds__demo ds__demo--stacked">
            <div className="event">
              <div className="event__text">
                <h2 className="event__name">Thursday club evening</h2>
                <p className="event__meta">4 courts · 6 rounds · 18 players · seed 20482</p>
              </div>
            </div>
          </div>

          <h3 className="ds__groupTitle">Chrome</h3>
          <div className="ds__frame">
            <div className="app__header">
              <span className="app__title">
                <PickleballMark />
                <span>
                  Mixed <span className="app__titleAccent">doubles</span>
                </span>
              </span>
              <span className="app__side">
                <span className="chip" aria-hidden="true">
                  ☰
                </span>
              </span>
            </div>
            <nav className="tabbar" aria-label="Sections">
              {["Roster", "Schedule", "Standings"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className="tabbar__button"
                  aria-current={tab === "Schedule" ? "page" : undefined}
                >
                  <span className="tabbar__mark" aria-hidden="true" />
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </Section>
      </div>
    </main>
  );
}
