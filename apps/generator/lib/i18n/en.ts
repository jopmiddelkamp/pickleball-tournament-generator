import type { Band, Grade, LawId, Level } from "@ptg/core";

/**
 * English is the reference catalog: its shape is the `Messages` type every
 * other language has to satisfy. Anything with a number in it is a function,
 * because plural rules and word order differ per language and a template with
 * holes cannot express that.
 *
 * Core's own strings (level names, bands, algorithm names, law labels) are
 * English and stay so; the app translates them here by id.
 */
export const en = {
  /** the two halves of the app title; the second is highlighted */
  title: ["Mixed doubles", "night"] as readonly [string, string],
  loading: "Loading tonight’s evening…",
  headerMeta: (players: number, courts: number) =>
    `${players}p · ${courts} ${courts === 1 ? "court" : "courts"}`,
  language: "Language",
  dismiss: "Dismiss",
  sections: "Sections",

  tabs: {
    roster: "Roster",
    setup: "Set up",
    schedule: "Courts",
    standings: "Standings",
  },

  storage: {
    blocked: "This browser is blocking storage, so nothing was restored.",
    corrupt:
      "The saved evening could not be read and was left untouched. Start a new one, or fix the browser storage entry.",
    mismatch:
      "The saved evening does not match what this version expects. Start a new one, or fix the browser storage entry.",
  },

  levels: {
    1: "Beginner",
    2: "Beginner+",
    3: "Intermediate",
    4: "Intermediate+",
    5: "Advanced",
    6: "Advanced+",
  } satisfies Record<Level, string>,

  bands: { 0: "low", 1: "mid", 2: "high" } satisfies Record<Band, string>,

  gender: { F: "Woman", M: "Man" },

  roster: {
    heading: "Who is playing?",
    lede: "Levels are the tier people picked at registration. They stay on this screen — nobody sees them next to a name during the evening.",
    name: "Name",
    namePlaceholder: "Add a player",
    playsAs: "Plays as",
    level: "Level",
    add: "Add player",
    full: (max: number) => `The roster is full at ${max} players.`,
    count: (players: number, men: number, women: number) =>
      `${players === 1 ? "player" : "players"} · ${men} m · ${women} w`,
    empty: "No one on the list yet. Add the first player above.",
    remove: "Remove",
  },

  setup: {
    heading: "Set up the evening",
    lede: "The same players, settings and seed always produce the same schedule. Reroll the seed for a different one.",
    courts: "Courts",
    rounds: "Rounds",
    restSlots: "Rest slots",
    scheduler: "Scheduler",
    gameTarget: "Games are played to",
    points: (points: number) => `${points} points`,
    seed: "Seed",
    reroll: "Reroll",
    capacity: (onCourt: number, resting: number) =>
      `${onCourt} on court each round, ${resting} resting.`,
    needPlayers: "Add at least four players before generating.",
    generate: "Generate schedule",
    quality: "Schedule quality",
    qualityLede:
      "The algorithm score (SPEC-2). It judges the schedule, never a player, and is only shown here.",
    waived: "waived",
    diagnostics: (partnerRepeat: number, opponentStreak: number, byeSpread: number, blowoutPercent: number) =>
      `Max partner repeat ${partnerRepeat} · longest same-opponent streak ${opponentStreak} · bye spread ${byeSpread} · blowout share ${blowoutPercent}%`,
    noScore: "Generate a schedule to see how it scores.",
    startOver: "Start a new evening",
  },

  grades: {
    excellent: "excellent",
    good: "good",
    weak: "weak",
    fail: "fail",
  } satisfies Record<Grade, string>,

  laws: {
    L1: "No wasted mixed teams",
    L2: "No third-time partnership",
    L3: "No 3 consecutive rounds against the same opponent",
  } satisfies Record<LawId, string>,

  /** keyed by algorithm id; an id missing here falls back to core's English */
  algorithms: {
    random: {
      name: "Random",
      description:
        "Shuffles everyone each round and pairs them off. The baseline the others are measured against.",
    },
    circle: {
      name: "Circle",
      description:
        "The classic whist wheel: one seat fixed, the rest rotate each round, opposite seats partner.",
    },
    latin: {
      name: "Latin rotation",
      description:
        "Men and women in two rows, shifted one place each round, so every mixed pair comes up once.",
    },
    greedy: {
      name: "Greedy matching",
      description:
        "Scores every possible pair and every possible match on freshness, mix and level, then picks the best fit each round.",
    },
  } as Record<string, { name: string; description: string } | undefined>,

  schedule: {
    heading: "Tonight’s courts",
    empty: "No schedule yet. Add your players, then generate one from the Set up tab.",
    print: "Print",
    rounds: "Rounds",
    roundChip: (round: number) => `R${round}`,
    roundOf: (round: number, total: number) => `Round ${round} of ${total}`,
    tapToMove: "Tap a player to move them.",
    tapTarget: "Now tap who they change places with.",
    scores: (score: string) => `Schedule scores ${score}.`,
    scoresBroken: (score: string, laws: string) => `Schedule scores ${score}, ${laws} now broken.`,
    lawJoiner: " and ",
    done: "Done",
    swap: "Swap players",
    resting: "Sitting this one out",
  },

  court: {
    label: (court: number) => `Court ${court}`,
    sameGender: (bands: string) => `same gender · ${bands}`,
    void: "Void",
    voided: "void",
    pointsLeft: (court: number) => `Points for the left team on court ${court}`,
    pointsRight: (court: number) => `Points for the right team on court ${court}`,
  },

  standings: {
    heading: "Standings",
    lede: "Everyone scores the points their own team made. A bye pays the round’s average, and a same-gender team pays two on top.",
    empty: "Generate a schedule first, then enter scores as the games finish.",
    played: (games: number) => `${games} played`,
    bye: (points: number) => `+${points} bye`,
    sameGender: (points: number) => `+${points} same gender`,
  },

  print: {
    loading: "Loading…",
    back: "Back to the app",
    summary: (players: number, courts: number, rounds: number, target: number, seed: number) =>
      `${players} players · ${courts} courts · ${rounds} rounds · games to ${target} · seed ${seed}`,
    empty: "No schedule has been generated yet.",
    round: (round: number) => `Round ${round}`,
    court: "Court",
    team: "Team",
    score: "Score",
    resting: "Resting: ",
    nameJoiner: " & ",
  },
};

export type Messages = typeof en;
