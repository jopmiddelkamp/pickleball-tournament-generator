/**
 * Single brand, no runtime theming. Every colour, size and duration the app
 * uses is named here and emitted as CSS custom properties in globals.css.
 *
 * The palette is the court itself: the green of the playing surface, the
 * chartreuse of the ball, and the paper of a printed draw sheet. Blue and plum
 * mark men and women, because mixed doubles is the whole point of the evening.
 */
export const colors = {
  court: "#2C6B4F",
  courtDark: "#20503B",
  courtDeep: "#173A2B",
  paper: "#F3F4EE",
  paperEdge: "#E4E6DC",
  accent: "#DCE64A",
  men: "#2B5FA8",
  women: "#A64A78",
  ink: "#151A17",
  inkSoft: "#5A635C",
  line: "#D3D7CA",
  white: "#FFFFFF",
} as const;

export const type = {
  display: "var(--font-display)",
  body: "var(--font-body)",
} as const;

export const radius = {
  sm: "6px",
  md: "12px",
  lg: "18px",
  pill: "999px",
} as const;

export const space = {
  xs: "4px",
  sm: "8px",
  md: "14px",
  lg: "22px",
  xl: "34px",
} as const;

/** Longest layout width; the app is built for a phone held court-side. */
export const layout = {
  maxWidth: "460px",
  tabBarHeight: "62px",
} as const;

/** Emitted once into :root so components can use var(--...) names. */
export const cssVariables: Record<string, string> = {
  "--court": colors.court,
  "--court-dark": colors.courtDark,
  "--court-deep": colors.courtDeep,
  "--paper": colors.paper,
  "--paper-edge": colors.paperEdge,
  "--accent": colors.accent,
  "--men": colors.men,
  "--women": colors.women,
  "--ink": colors.ink,
  "--ink-soft": colors.inkSoft,
  "--line": colors.line,
  "--radius-sm": radius.sm,
  "--radius-md": radius.md,
  "--radius-lg": radius.lg,
  "--radius-pill": radius.pill,
  "--space-xs": space.xs,
  "--space-sm": space.sm,
  "--space-md": space.md,
  "--space-lg": space.lg,
  "--space-xl": space.xl,
  "--max-width": layout.maxWidth,
  "--tab-bar-height": layout.tabBarHeight,
};
