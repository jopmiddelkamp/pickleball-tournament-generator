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
  title: ["Mixed", "doubles"] as readonly [string, string],
  language: "Language",
  menu: "Menu",
  dismiss: "Dismiss",
  sections: "Sections",

  /** The public /levels page: our six tiers set against the common 1.0–5.5 rating scale. */
  levelGuide: {
    heading: "What the levels mean",
    lede: "Every sign-up carries a self-reported level, and the scheduler uses it to keep courts balanced. Pickleball uses a 1.0–5.5 rating scale; we fold it into six tiers so choosing is quick.",
    howToPick: "Pick the tier that sounds like you on an average evening, not your best one. Between two? Take the lower. Got a DUPR rating? Use the range next to each tier.",
    rating: (range: string) => `Rating ${range}`,
    tiers: {
      1: {
        range: "1.0–2.0",
        summary: "New to the game. Still learning the rules, the serve and where to stand.",
        skills: [
          "Rallies are short; getting the ball over the net is the goal.",
          "Serve and return are unreliable.",
          "Not yet familiar with the kitchen rules or the scoring call.",
        ],
      },
      2: {
        range: "2.5",
        summary: "Knows the rules and can keep a short rally going with a slower ball.",
        skills: [
          "Serve and return land most of the time.",
          "Plays mostly from the baseline; the third-shot drop and dinking are new.",
          "Knows the basics of court position in doubles.",
        ],
      },
      3: {
        range: "3.0",
        summary: "Holds a rally at medium pace and knows where to be in doubles.",
        skills: [
          "Serve and return are reliable, with some depth.",
          "Moves up to the kitchen line and starts to dink and drop, without much consistency yet.",
          "Volleys the easy balls; still makes unforced errors under pressure.",
        ],
      },
      4: {
        range: "3.5",
        summary: "Comfortable at the kitchen line: dinks, drops and volleys with some control.",
        skills: [
          "Uses the third-shot drop on purpose and varies pace.",
          "Sustains dink rallies and waits for the attackable ball.",
          "Communicates with a partner and moves as a team.",
        ],
      },
      5: {
        range: "4.0",
        summary: "Controls rallies with patience and purpose, and makes few unforced errors.",
        skills: [
          "Dinks, drops, drives and resets on demand, with spin and placement.",
          "Reads opponents, punishes high balls and picks the moment to attack.",
          "Defends fast exchanges and blocks hard drives.",
        ],
      },
      6: {
        range: "4.5 and up",
        summary: "Tournament level: dependable under pressure and strong in every shot.",
        skills: [
          "Plays strategy, not just points: anticipates, sets up and finishes.",
          "Resets attacks and rarely gives a rally away.",
          "Adapts style and pace to the opponents across the net.",
        ],
      },
    },
  },

  tabs: {
    roster: "Roster",
    schedule: "Courts",
    standings: "Standings",
    rules: "Rules",
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
    lede: "Levels are the tier people picked at registration. They show on the sign-up list and the standings, never on the courts.",
    name: "Name",
    namePlaceholder: "Add a player",
    playsAs: "Plays as",
    level: "Level",
    count: (players: number, men: number, women: number) =>
      `${players === 1 ? "player" : "players"} · ${men} m · ${women} w`,
    empty: "No one on the list yet. Add the first player above.",
    remove: "Remove",
    edit: "Edit",
    save: "Save",
    cancelEdit: "Cancel",
    guestOf: (host: string) => `+1 of ${host}`,
    confirmedCount: (confirmed: number, max: number) => `${confirmed} of ${max} places taken`,
    waitingHeading: "Waiting list",
    frozen: "The event has started, so the list is frozen. Use Back to registration to change it.",
    registrationOpen: "Registration is open",
    registrationClosed: "Registration is closed",
    startEvent: "Start event",
    drawing: "Drawing the schedule…",
    drawingDetail: "Trying a thousand draws and keeping the best one.",
    backToRegistration: "Back to registration",
  },

  setup: {
    courts: "Courts",
    rounds: "Rounds",
    restSlots: "Rest slots",
    scheduler: "Scheduler",
    gameTarget: "Games are played to",
    points: (points: number) => `${points} points`,
    roundMinutes: "Time limit per round",
    noClock: "No clock",
    minutes: (n: number) => `${n} minutes`,
    roundMinutesHint: "When the next round starts, a game that has not finished is rounded up: the leading team goes to the target and the other team gets the same lift, so 5–8 counts as 8–11.",
    seed: "Seed",
    reroll: "Reroll",
    capacity: (onCourt: number, resting: number) =>
      `${onCourt} on court each round, ${resting} resting.`,
    needPlayers: "At least four confirmed players are needed to start.",
    quality: "Schedule quality",
    qualityLede:
      "The algorithm score (SPEC-2). It judges the schedule, never a player, and is only shown here.",
    waived: "waived",
    diagnostics: (partnerRepeat: number, opponentStreak: number, byeSpread: number, blowoutPercent: number) =>
      `Max partner repeat ${partnerRepeat} · longest same-opponent streak ${opponentStreak} · bye spread ${byeSpread} · blowout share ${blowoutPercent}%`,
    suggested: "Courts and rest slots follow the number of confirmed players.",
    useSuggestion: "Use the suggestion",
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
    heading: "Today’s courts",
    empty: "No schedule yet. Start the event from the Roster tab once everyone is in.",
    print: "Print",
    adjust: "Adjust schedule",
    rounds: "Rounds",
    roundChip: (round: number) => `R${round}`,
    allRounds: "All",
    roundOf: (round: number, total: number) => `Round ${round} of ${total}`,
    resting: "Sitting this one out",
    startRound: (n: number) => `Start round ${n}`,
    confirmRound: (n: number) => `Confirm round ${n}`,
    ended: "The event is over — final standings are on the standings tab.",
    notStarted: "Nothing has started yet. Start round 1 when the first games are ready.",
    currentRound: (n: number) => `Round ${n} is on court`,
  },

  clock: {
    label: "Round clock",
    start: (minutes: number) => `Start the ${minutes}-minute clock`,
    running: (minutes: number) => `of ${minutes} minutes left`,
    timeUp: "Time's up — finish the rally and report your score.",
    stop: "Stop",
    reset: "Clear",
  },

  rules: {
    heading: "How scoring works",
    lede: "Everything on the standings comes from the scores entered on court. Nothing is judged by hand.",
    points: {
      title: "Game points",
      body: (target: number) => `Games are played to ${target}. You score the points your own team made, win or lose.`,
      example: (target: number) => `A game ends ${target}–${Math.max(0, target - 4)}: both winners get ${target}, both losers get ${Math.max(0, target - 4)}.`,
    },
    clock: {
      title: "The clock",
      body: (minutes: number, target: number) => `Each round has ${minutes} minutes. When the next round is confirmed, a game that did not finish is rounded up: the leading team goes to ${target} and the other team gets the same lift, so the margin stands.`,
      example: (minutes: number, target: number) => `Time is up at 5–8: it counts as ${target - 3}–${target}.`,
    },
    bye: {
      title: "Resting",
      body: "A round you sit out is called a bye — the standings show it as “+n bye”. When you sit a round out you get the average of what everyone on court scored that round, so resting never costs you and never beats playing.",
      example: "The courts scored 11, 11, 5, 5, 11, 11, 9, 9 → the average is 9, so each resting player gets +9.",
    },
    ranking: {
      title: "Ranking",
      body: "The evening celebrates the best woman and the best man: the top three women and the top three men sit above the list. Highest total wins. Equal totals are split by point difference: the points your teams scored minus the points scored against you. Equal on both and you share the place.",
      example: "Two players on 61: +12 difference ranks above +4.",
    },
  },

  court: {
    label: (court: number) => `Court ${court}`,
    sameGender: (bands: string) => `same gender · ${bands}`,
    void: "Void",
    voided: "void",
    countsAs: (score: string) => `Counts as ${score} — time was up.`,
    roundedFrom: (score: string) => `Rounded up from ${score} at the bell.`,
    pointsLeft: (court: number) => `Points for the left team on court ${court}`,
    pointsRight: (court: number) => `Points for the right team on court ${court}`,
  },

  standings: {
    heading: "Standings",
    lede: "Everyone scores the points their own team made. A bye pays the round’s average. Equal totals are split by point difference, shown under the total.",
    empty: "Generate a schedule first, then enter scores as the games finish.",
    played: (games: number) => `${games} played`,
    bye: (points: number) => `+${points} bye`,
    bestHeading: "Best of the night",
    bestLede: "The three women and three men with the most points this evening.",
    top: { women: "Best women", men: "Best men" },
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
    lede: "Organisers set up events and run them court-side. Players never need an account.",
    continueWithGoogle: "Continue with Google",
    logout: "Log out",
    error: "Could not sign you in with Google. Try again.",
  },

  picker: {
    prevMonth: "Previous month",
    nextMonth: "Next month",
    hour: "Hour",
    minutes: "Minutes",
    done: "Done",
  },

  organiser: {
    heading: "Your events",
    lede: "Create an event, share its link in the group chat, and run it from here on the day.",
    newTournament: "New event",
    empty: "No events yet. Create the first one.",
    status: {
      open: "Registration open",
      closed: "Registration closed",
      generated: "Schedule ready",
      live: "Event running",
      finished: "Finished",
    },
    players: (confirmed: number, max: number) => `${confirmed} / ${max} players`,
    copyLink: "Copy invite",
    inviteMessage: (name: string, when: string, url: string) => `Join us for ${name} on ${when}! Sign up and follow the event here: ${url}`,
    copied: "Link copied",
    open: "Open",
    form: {
      heading: "New event",
      name: "Name",
      namePlaceholder: "Friday mixed doubles",
      location: "Location (optional)",
      locationPlaceholder: "Balanca Pickleball Court",
      startsAt: "Starts",
      maxCourts: "Courts available",
      perCourt: "Spots per court (playing + resting)",
      capacity: (courts: number, cap: number) =>
        `${courts} ${courts === 1 ? "court" : "courts"} — up to ${cap} players. Anyone above that joins the waiting list, first come first served.`,
      minLevel: "Minimum level",
      anyLevel: "Any level",
      minLevelHint: "Players pick their own level when they sign up. With a minimum set, lower levels cannot register.",
      create: "Create event",
      invalid: "Check the fields: a name, a date, and 1–6 courts.",
    },
    edit: {
      open: "Edit",
      heading: "Edit event",
      save: "Save changes",
      cancel: "Cancel",
      signedUp: (n: number) => `${n} already signed up.`,
      demote: (n: number) => `${n} signed-up ${n === 1 ? "player" : "players"} would drop to the waiting list.`,
      notify: (n: number) => `Capacity went down: ${n} signed-up ${n === 1 ? "player" : "players"} dropped to the waiting list. Post an update in the group chat so everyone checks whether they still have a spot.`,
      notifyPromoted: "Someone moved up from the waiting list. Post an update in the group chat so they know they're in.",
      copyUpdate: "Copy message for the group chat",
      updateDemoted: (name: string, url: string) => `Update for ${name}: we had to reduce capacity, so the confirmed list changed. Please check whether you still have a spot: ${url}`,
      updatePromoted: (name: string, url: string) => `Update for ${name}: a spot opened up and someone moved off the waiting list. Check your status here: ${url}`,
    },
  },

  workspace: {
    unreadable: "The stored schedule could not be read. Discard it and generate again.",
    errors: {
      "not-found": "This event no longer exists.",
      invalid: "That change was not valid and was ignored.",
      frozen: "The event has started; go back to registration before changing the list.",
      open: "Close registration first.",
      players: "At least four confirmed players are needed.",
      full: "This event has reached the registration limit.",
      state: "That step is not available right now.",
    },
  },

  public: {
    startsAt: (when: string) => `Starts ${when}`,
    playedTo: (n: number) => `Games are played to ${n} points`,
    timeLimit: (n: number) => `with ${n} minutes per round; a game still going at the bell is rounded up.`,
    spots: (confirmed: number, cap: number, waiting: number) =>
      waiting > 0 ? `${confirmed} of ${cap} places taken · ${waiting} waiting` : `${confirmed} of ${cap} places taken`,
    registerHeading: "Play along?",
    registerLede: "Fill in your name once; this phone remembers you.",
    register: "Sign me up",
    registerGroup: "Sign us up",
    waitlistWarning: "The event is full — you would join the waiting list and move up when someone cancels.",
    youAreIn: "You're in!",
    registeredAs: (name: string, when: string) => `Signed up as ${name} · ${when}`,
    signedUpHeading: (n: number) => `Attendees (${n})`,
    nobodyYet: "Nobody has signed up yet — be the first.",
    you: "you",
    yourGuest: "your +1",
    waiting: (n: number) => `You're number ${n} on the waiting list.`,
    cancel: "Cancel my registration",
    cancelGroup: "Cancel our registration",
    addGuest: "Add a +1",
    addGuestSubmit: "Add",
    guestHeading: "Bring a +1",
    guestLede: "They sign up under your name and count like any registration.",
    guestConfirmed: "In",
    guestNumber: (n: number) => `+1 #${n}`,
    guestWaiting: (n: number) => `Waiting #${n}`,
    frozen: "The schedule is set. Tell the organiser if you cannot make it.",
    closed: "Registration is closed.",
    fullMessage: "Registration is closed — the event is completely full.",
    round: (n: number) => `Round ${n}`,
    yourCourt: (court: number, partner: string, a: string, b: string) =>
      `Court ${court} — with ${partner}, against ${a} & ${b}`,
    youRest: "You rest this round — back in the next one.",
    notStarted: "The schedule is ready. The first round starts soon.",
    notSure: "Not sure",
    notSureHint: "Pick a level to sign up. Not sure which one fits?",
    levelsLink: "See what the levels mean",
    minLevel: (level: string) => `This evening is for ${level} and up.`,
    errors: {
      invalid: "Enter a name, and pick how you play and your level.",
      level: "This event has a minimum level. Check the level picked for each player.",
      closed: "Registration is closed.",
      full: "The event is completely full.",
      already: "This phone already has an active registration for this event.",
      guestLimit: "You have reached the +1 limit for one registration.",
      failed: "That did not work. Refresh the page and try again.",
    },
  },
};

export type Messages = typeof en;
