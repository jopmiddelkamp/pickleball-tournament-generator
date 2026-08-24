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
  language: "Language",
  dismiss: "Dismiss",
  sections: "Sections",

  tabs: {
    roster: "Roster",
    setup: "Set up",
    schedule: "Courts",
    standings: "Standings",
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
    confirmedCount: (confirmed: number, max: number) => `${confirmed} of ${max} places taken`,
    waitingHeading: "Waiting list",
    position: (n: number) => `#${n}`,
    frozen: "The schedule is generated, so the list is frozen. Discard the schedule on the Set up tab to change it.",
    registrationOpen: "Registration is open",
    registrationClosed: "Registration is closed",
    closeRegistration: "Close registration",
    openRegistration: "Reopen registration",
    walkIn: "Add a walk-in",
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
    suggested: "Courts and rest slots follow the number of confirmed players.",
    useSuggestion: "Use the suggestion",
    closeFirst: "Close registration before generating, so the list stops moving.",
    discardFirst: "A schedule is already generated. Discard it first to generate a new one.",
    discard: "Discard schedule",
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

  auth: {
    loginHeading: "Organiser login",
    signUpHeading: "Create an organiser account",
    lede: "Organisers set up evenings and run them court-side. Players never need an account.",
    email: "Email",
    password: "Password",
    passwordHint: (min: number) => `At least ${min} characters`,
    login: "Log in",
    signUp: "Create account",
    logout: "Log out",
    toSignUp: "No account yet? Create one",
    toLogin: "Already have an account? Log in",
    confirmEmail: "Check your inbox and confirm your email, then log in.",
    errors: {
      invalid: "Enter a valid email and a password of at least 8 characters.",
      credentials: "That email and password do not match.",
      exists: "There is already an account for that email. Log in instead.",
      failed: "Could not create the account. Try again in a moment.",
    },
  },

  organiser: {
    heading: "Your evenings",
    lede: "Create an evening, share its link in the group chat, and run it from here on the night.",
    newTournament: "New evening",
    empty: "No evenings yet. Create the first one.",
    status: {
      open: "Registration open",
      closed: "Registration closed",
      generated: "Schedule ready",
      live: "Evening running",
      finished: "Finished",
    },
    players: (confirmed: number, max: number) => `${confirmed} / ${max} players`,
    copyLink: "Copy sign-up link",
    copied: "Link copied",
    open: "Open",
    form: {
      heading: "New evening",
      name: "Name",
      namePlaceholder: "Friday mixed doubles",
      startsAt: "Starts",
      maxCourts: "Courts available",
      capacity: (courts: number, cap: number) =>
        `${courts} ${courts === 1 ? "court" : "courts"} — up to ${cap} players. Anyone above that joins the waiting list, first come first served.`,
      create: "Create evening",
      invalid: "Check the fields: a name, a date, and 1–6 courts.",
    },
  },

  workspace: {
    unreadable: "The stored schedule could not be read. Discard it and generate again.",
    errors: {
      "not-found": "This evening no longer exists.",
      invalid: "That change was not valid and was ignored.",
      frozen: "The schedule is generated; discard it before changing the list.",
      open: "Close registration first.",
      players: "At least four confirmed players are needed.",
      full: "This evening has reached the registration limit.",
    },
  },
};

export type Messages = typeof en;
