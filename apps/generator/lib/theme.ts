/**
 * The design system's source of truth.
 *
 * Structured after Material 3's three tiers, in this order:
 *
 *   1. `palette`  - the reference tier. Raw tones of the brand's four colour
 *      families, named by lightness. Never used directly by a component.
 *   2. `lightScheme`, `typeScale`, `radius`, `space`, `elevation`, `onBrand`,
 *      `opacity`, `motion`, `zIndex` - the system tier. Semantic roles that say what a
 *      value is *for*. This is what CSS consumes.
 *   3. Component tokens (`--court-line`, `--print-ink`, ...) live next to
 *      their component in globals.css and are derived from the system tier.
 *
 * The brand is the court itself: the green of the playing surface, the
 * chartreuse of the ball, and the paper of a printed draw sheet. Blue and plum
 * mark men and women, because mixed doubles is the whole point of the evening.
 *
 * Everything below is emitted as CSS custom properties by `cssVariables`,
 * which is generated from these structures rather than hand-written, so a
 * token cannot be defined here and silently missing in the browser.
 *
 * See `docs/DESIGN-SYSTEM.md` for the rationale and `/design` for a
 * living specimen of every token.
 */

// ---------------------------------------------------------------------------
// 1. Reference tier: the tonal palette
// ---------------------------------------------------------------------------

/**
 * Four families, each a fixed hue and saturation at varying lightness, plus
 * the categorical and feedback colours that sit outside the ramps.
 *
 * Keys are HSL lightness, so the ramps extend by adding tones rather than by
 * inventing colours: court is hsl(153.5 42.5% L), ball hsl(64 71% L), paper
 * hsl(74 16% L), ink hsl(150 8% L).
 */
export const palette = {
  /** The playing surface. */
  court: {
    16: "#173A2B",
    22: "#20503B",
    30: "#2C6B4F",
  },
  /** The ball. */
  ball: {
    53: "#CDD736",
    60: "#DCE64A",
  },
  /** The draw sheet. */
  paper: {
    82: "#D3D7CA",
    88: "#E4E6DC",
    95: "#F3F4EE",
    100: "#FFFFFF",
  },
  /** Text. */
  ink: {
    9: "#151A17",
    37: "#5A635C",
  },
  /** Categorical, not tonal: these mark a player's gender and never shade. */
  men: "#2B5FA8",
  women: "#A64A78",
  /** Feedback. */
  error: "#9A3324",
  warning: "#C4762A",
} as const;

// ---------------------------------------------------------------------------
// 2. System tier: colour roles
// ---------------------------------------------------------------------------

/**
 * Every colour a component may use, named by job. One value often serves
 * several roles - in a light scheme `on-primary` and `surface` are both
 * paper 95 - which is exactly the point: a dark scheme reassigns the roles
 * without a component knowing.
 *
 * Where Material 3 composites a translucent state layer over a base colour,
 * this system names the resulting value instead (`primaryHover`). The brand
 * darkens on hover rather than washing out, which reads better on the court
 * green and survives being printed.
 */
export const lightScheme = {
  /** Filled buttons, the court surface, and anything chosen: a segment, a
   * round, a level, a day in the picker. Selection is always this one green. */
  primary: palette.court[30],
  /** The same fill, one tone down: hover and pressed states. */
  primaryHover: palette.court[22],
  /** Brand text on a light surface: a quiet button's label, the event name. */
  primaryStrong: palette.court[22],
  onPrimary: palette.paper[95],

  /** The ball: the accent button, the current tab, the event name's
   * highlighter, and on a court card the one player being swapped. */
  secondary: palette.ball[60],
  secondaryHover: palette.ball[53],
  onSecondary: palette.court[16],

  /** The sheet the evening is played off. */
  surface: palette.paper[95],
  /** Lifted off the sheet: cards, inputs, panels, popovers. */
  surfaceRaised: palette.paper[100],
  /** Recessed: the page behind the sheet, bench chips, quiet hover fills. */
  surfaceSunken: palette.paper[88],
  onSurface: palette.ink[9],
  /** Labels, captions and anything secondary to the content. */
  onSurfaceVariant: palette.ink[37],
  outline: palette.paper[82],

  /** Brand chrome: the header, the tab bar and the menu that drops from it. */
  surfaceBrand: palette.court[16],
  onSurfaceBrand: palette.paper[95],

  /** Feedback. `warning` reaches 3.5:1 on white - a rule or icon, not text. */
  error: palette.error,
  warning: palette.warning,

  /** The keyboard focus ring. Shares a value with `men`, not a meaning. */
  focus: palette.men,

  /** Gender markers. SPEC-1 §5: these mark gender only, never skill. */
  men: palette.men,
  onMen: palette.paper[100],
  women: palette.women,
  onWomen: palette.paper[100],

  /** Tints every shadow so elevation follows the scheme. */
  shadow: palette.ink[9],
} as const;

export type ColorScheme = typeof lightScheme;

// ---------------------------------------------------------------------------
// 2b. System tier: type scale
// ---------------------------------------------------------------------------

/** Bricolage Grotesque for display, Public Sans for everything read as text. */
export const fontStacks = {
  display: "var(--font-display), system-ui, sans-serif",
  body: "var(--font-body), system-ui, sans-serif",
} as const;

interface TypeStyle {
  family: keyof typeof fontStacks;
  /** px */
  size: number;
  weight: number;
  /** unitless multiplier */
  line: number;
  /** em */
  tracking: number;
  /** px at the `wide` breakpoint, when the role grows with the viewport */
  sizeWide?: number;
}

/**
 * Five families, sized from what the app already renders. Display carries the
 * brand voice and is set tight; body is set for reading; action and label are
 * the interface's own vocabulary.
 *
 * Numerals get their own roles because scores and standings are read as
 * figures, not prose: they are set in the display face and always paired with
 * `font-variant-numeric: tabular-nums` so columns stay aligned.
 */
export const typeScale = {
  /** The one big number on a screen: the roster count. */
  displayLg: { family: "display", size: 34, weight: 800, line: 1.0, tracking: -0.03 },
  /** A screen's heading. */
  displayMd: { family: "display", size: 26, weight: 700, line: 1.1, tracking: -0.025, sizeWide: 30 },
  /** The app's own name in the header. */
  displaySm: { family: "display", size: 20, weight: 800, line: 1.1, tracking: -0.02, sizeWide: 22 },

  /** The event's name: context above a screen, not the screen's own heading. */
  headline: { family: "display", size: 22, weight: 800, line: 1.15, tracking: -0.02 },
  /** A section inside a screen. */
  title: { family: "display", size: 18, weight: 800, line: 1.2, tracking: -0.02 },

  /** A player's total. */
  numeralLg: { family: "display", size: 19, weight: 800, line: 1.0, tracking: 0 },
  /** A rank, a game score. */
  numeralMd: { family: "display", size: 17, weight: 800, line: 1.0, tracking: 0 },

  /** Body copy and form fields. 16px keeps iOS from zooming on focus. */
  bodyLg: { family: "body", size: 16, weight: 400, line: 1.45, tracking: 0 },
  /** A name on court: read at arm's length, so it is set heavier. */
  bodyMd: { family: "body", size: 15, weight: 600, line: 1.2, tracking: 0 },
  /** Supporting copy: ledes, notices, menu items, empty states. */
  bodySm: { family: "body", size: 14, weight: 400, line: 1.45, tracking: 0 },
  /** Metadata read after the thing it describes. */
  bodyXs: { family: "body", size: 12, weight: 400, line: 1.4, tracking: 0 },

  /** Buttons. */
  actionLg: { family: "body", size: 15, weight: 700, line: 1.2, tracking: 0 },
  /** Compact buttons and choice chips. */
  actionSm: { family: "body", size: 13, weight: 700, line: 1.2, tracking: 0 },

  /** Uppercase field labels and navigation. */
  label: { family: "body", size: 11, weight: 600, line: 1.2, tracking: 0.12 },
  /** The same size with more authority: a court's number, the bench. */
  labelStrong: { family: "body", size: 11, weight: 700, line: 1.2, tracking: 0.16 },
  /** The smallest readable mark: the gender chip, the court's own footnote. */
  micro: { family: "body", size: 10, weight: 700, line: 1.2, tracking: 0.08 },
} as const satisfies Record<string, TypeStyle>;

export type TypeRole = keyof typeof typeScale;

// ---------------------------------------------------------------------------
// 2c. System tier: shape, space, elevation, state, motion, layers
// ---------------------------------------------------------------------------

/**
 * The shape scale. `sm` is the default for anything rectangular, `md` for a
 * container that holds other things, `pill` for anything you tap.
 */
export const radius = {
  sm: "6px",
  md: "12px",
  pill: "999px",
} as const;

/**
 * A 4 / 8 / 14 / 22 / 34 ramp, deliberately not Material's 4dp grid: the app
 * is laid out on it and the wider steps give a phone screen more air than a
 * 4dp grid does at the same nominal size.
 */
export const space = {
  xs: "4px",
  sm: "8px",
  md: "14px",
  lg: "22px",
  xl: "34px",
} as const;

/**
 * Three levels, not Material's six, because the app has three depths: flat on
 * the sheet, a panel that opens in place, and a menu that floats over
 * everything. Add a level when something needs one, not before.
 */
export const elevation = {
  0: "none",
  /** A panel that opens in place: the date and time picker. */
  1: "0 10px 30px color-mix(in srgb, var(--color-shadow) 12%, transparent)",
  /** A layer over the page: the header menu. */
  2: "0 12px 32px color-mix(in srgb, var(--color-shadow) 35%, transparent)",
} as const;

/**
 * The header, the tab bar and the menu are one dark brand surface, and
 * everything drawn on them is the same paper at a different strength: a
 * hairline edge, a chip's fill, a border, secondary text. Material 3
 * composites hover and pressed states this way; here the mechanism covers the
 * chrome's static parts too, because they are the same material.
 *
 * Emitted as finished `color-mix` values (`--brand-fill`), not as bare
 * ratios, so a stylesheet never has to restate the mix.
 */
export const onBrand = {
  /** The tab bar's top edge against the header. */
  hairline: 0.12,
  /** A translucent control tinting under the pointer. */
  hover: 0.12,
  /** A chip at rest. */
  fill: 0.18,
  /** That chip under the pointer. */
  fillHover: 0.3,
  /** A border drawn on the chrome. */
  outline: 0.35,
  /** Text secondary to the chrome: the seed, an inactive tab. */
  text: 0.72,
} as const;

export const opacity = {
  /** A control that cannot be used, whatever surface it sits on. */
  disabled: 0.45,
  /** Present but not part of the current context: last month's days. */
  muted: 0.55,
} as const;

/**
 * Print is its own medium with its own scheme. A club printer is not colour
 * managed and the sheet gets read on a bench in bad light, so the draw sheet
 * drops the brand palette for maximum contrast: black on white, grey rules.
 */
export const printScheme = {
  surface: "#FFFFFF",
  ink: "#000000",
  rule: "#999999",
  fill: "#EEEEEE",
} as const;

export const motion = {
  /** Long enough to be seen, short enough not to be waited for. */
  durationFast: "140ms",
  /** Material 3's standard easing: quick to start, settles into place. */
  easingStandard: "cubic-bezier(0.2, 0, 0, 1)",
} as const;

/** Every stacking context in the app, so no component invents a number. */
export const zIndex = {
  tabBar: 10,
  /** Above the tab bar's content, below the menu that drops out of it. */
  header: 15,
  scrim: 19,
  menu: 20,
} as const;

/**
 * Phone first: one column up to `maxWidth`. From `wide` up (a laptop or a
 * desktop browser) the sheet grows to `maxWidthWide`, the tab bar moves under
 * the header, and courts and lists lay out in grids. `wide` and `wider` cannot
 * be CSS custom properties - media queries do not read them - so they are
 * repeated as literals in globals.css, with this as the source.
 */
export const layout = {
  maxWidth: "460px",
  maxWidthWide: "1120px",
  /** Padding plus the 30px chips; fixed so the tab rail can stick below it. */
  headerHeight: "58px",
  headerHeightWide: "62px",
  tabBarHeight: "62px",
  /** Two courts fit side by side. */
  wide: "720px",
  /** Three courts fit side by side. */
  wider: "1080px",
} as const;

// ---------------------------------------------------------------------------
// 3. Emission
// ---------------------------------------------------------------------------

const kebab = (name: string): string => name.replace(/[A-Z0-9]+/g, (match) => `-${match.toLowerCase()}`);

/**
 * Emitted once into :root by app/layout.tsx so components can use var(--...)
 * names. Built by walking the structures above: adding a role here is the only
 * step needed to make it available to CSS.
 */
export const cssVariables: Record<string, string> = {
  ...Object.fromEntries(Object.entries(lightScheme).map(([role, value]) => [`--color-${kebab(role)}`, value])),

  "--font-stack-display": fontStacks.display,
  "--font-stack-body": fontStacks.body,

  ...Object.fromEntries(
    Object.entries(typeScale).flatMap(([role, style]) => {
      const prefix = `--text-${kebab(role)}`;
      return [
        [`${prefix}-font`, `var(--font-stack-${style.family})`],
        [`${prefix}-size`, `${style.size}px`],
        [`${prefix}-weight`, String(style.weight)],
        [`${prefix}-line`, String(style.line)],
        [`${prefix}-tracking`, `${style.tracking}em`],
        ...("sizeWide" in style ? [[`${prefix}-size-wide`, `${style.sizeWide}px`]] : []),
      ];
    }),
  ),

  ...Object.fromEntries(Object.entries(radius).map(([step, value]) => [`--radius-${step}`, value])),
  ...Object.fromEntries(Object.entries(space).map(([step, value]) => [`--space-${step}`, value])),
  ...Object.fromEntries(Object.entries(elevation).map(([level, value]) => [`--elevation-${level}`, value])),
  ...Object.fromEntries(
    Object.entries(onBrand).map(([name, ratio]) => [
      `--brand-${kebab(name)}`,
      `color-mix(in srgb, var(--color-on-surface-brand) ${Math.round(ratio * 100)}%, transparent)`,
    ]),
  ),
  ...Object.fromEntries(Object.entries(opacity).map(([name, value]) => [`--opacity-${kebab(name)}`, String(value)])),
  ...Object.fromEntries(Object.entries(printScheme).map(([role, value]) => [`--print-${kebab(role)}`, value])),
  ...Object.fromEntries(Object.entries(motion).map(([name, value]) => [`--${kebab(name)}`, value])),
  ...Object.fromEntries(Object.entries(zIndex).map(([name, value]) => [`--z-${kebab(name)}`, String(value)])),

  "--max-width": layout.maxWidth,
  "--max-width-wide": layout.maxWidthWide,
  "--header-height": layout.headerHeight,
  "--header-height-wide": layout.headerHeightWide,
  "--tab-bar-height": layout.tabBarHeight,
};
