import type { Messages } from "./en";

export const es: Messages = {
  title: ["Noche de dobles", "mixtos"],
  language: "Idioma",
  dismiss: "Cerrar",
  sections: "Secciones",

  tabs: {
    roster: "Jugadores",
    setup: "Ajustes",
    schedule: "Pistas",
    standings: "Ranking",
  },

  levels: {
    1: "Principiante",
    2: "Principiante+",
    3: "Intermedio",
    4: "Intermedio+",
    5: "Avanzado",
    6: "Avanzado+",
  },

  bands: { 0: "bajo", 1: "medio", 2: "alto" },

  gender: { F: "Mujer", M: "Hombre" },

  roster: {
    heading: "¿Quién juega?",
    lede: "El nivel es el que cada uno eligió al inscribirse. Se queda en esta pantalla: nadie lo ve junto a un nombre durante la noche.",
    name: "Nombre",
    namePlaceholder: "Añadir jugador",
    playsAs: "Juega como",
    level: "Nivel",
    add: "Añadir jugador",
    full: (max) => `La lista está completa con ${max} jugadores.`,
    count: (players, men, women) => `${players === 1 ? "jugador" : "jugadores"} · ${men} h · ${women} m`,
    empty: "Todavía no hay nadie en la lista. Añade al primer jugador arriba.",
    remove: "Quitar",
    confirmedCount: (confirmed, max) => `${confirmed} de ${max} plazas ocupadas`,
    waitingHeading: "Lista de espera",
    position: (n) => `#${n}`,
    frozen: "El calendario ya está generado, así que la lista está bloqueada. Descarta el calendario en la pestaña Ajustes para cambiarla.",
    registrationOpen: "La inscripción está abierta",
    registrationClosed: "La inscripción está cerrada",
    closeRegistration: "Cerrar inscripción",
    openRegistration: "Reabrir inscripción",
    walkIn: "Añadir un jugador de última hora",
  },

  setup: {
    heading: "Prepara la noche",
    lede: "Los mismos jugadores, ajustes y semilla siempre dan el mismo calendario. Cambia la semilla para obtener otro.",
    courts: "Pistas",
    rounds: "Rondas",
    restSlots: "Descansos",
    scheduler: "Algoritmo",
    gameTarget: "Los partidos se juegan a",
    points: (points) => `${points} puntos`,
    seed: "Semilla",
    reroll: "Cambiar",
    capacity: (onCourt, resting) => `${onCourt} en pista cada ronda, ${resting} descansando.`,
    needPlayers: "Añade al menos cuatro jugadores antes de generar.",
    generate: "Generar calendario",
    quality: "Calidad del calendario",
    qualityLede:
      "La puntuación del algoritmo (SPEC-2). Juzga el calendario, nunca a un jugador, y solo se muestra aquí.",
    waived: "exento",
    diagnostics: (partnerRepeat, opponentStreak, byeSpread, blowoutPercent) =>
      `Máx. repetición de pareja ${partnerRepeat} · racha más larga contra el mismo rival ${opponentStreak} · diferencia de descansos ${byeSpread} · partidos desiguales ${blowoutPercent}%`,
    noScore: "Genera un calendario para ver su puntuación.",
    suggested: "Las pistas y los descansos siguen el número de jugadores confirmados.",
    useSuggestion: "Usar la sugerencia",
    closeFirst: "Cierra la inscripción antes de generar, para que la lista deje de moverse.",
    discardFirst: "Ya se ha generado un calendario. Descártalo primero para generar uno nuevo.",
    discard: "Descartar calendario",
  },

  grades: {
    excellent: "excelente",
    good: "bueno",
    weak: "flojo",
    fail: "suspenso",
  },

  laws: {
    L1: "Sin parejas mixtas desperdiciadas",
    L2: "Sin tercera vez con la misma pareja",
    L3: "Sin 3 rondas seguidas contra el mismo rival",
  },

  algorithms: {
    random: {
      name: "Aleatorio",
      description: "Mezcla a todos cada ronda y los empareja. La referencia con la que se comparan los demás.",
    },
    circle: {
      name: "Círculo",
      description:
        "La clásica rueda de whist: un asiento fijo, el resto rota cada ronda y los asientos opuestos forman pareja.",
    },
    latin: {
      name: "Rotación latina",
      description: "Hombres y mujeres en dos filas, desplazadas un puesto cada ronda, para que cada pareja mixta salga una vez.",
    },
    greedy: {
      name: "Emparejamiento voraz",
      description:
        "Puntúa cada pareja y cada partido posible por novedad, mezcla y nivel, y elige el mejor encaje en cada ronda.",
    },
  },

  schedule: {
    heading: "Pistas de esta noche",
    empty: "Aún no hay calendario. Añade a los jugadores y genera uno desde la pestaña Ajustes.",
    print: "Imprimir",
    rounds: "Rondas",
    roundChip: (round) => `R${round}`,
    roundOf: (round, total) => `Ronda ${round} de ${total}`,
    tapToMove: "Toca a un jugador para moverlo.",
    tapTarget: "Ahora toca con quién se cambia de sitio.",
    scores: (score) => `El calendario puntúa ${score}.`,
    scoresBroken: (score, laws) => `El calendario puntúa ${score}; ${laws} ahora incumplida.`,
    lawJoiner: " y ",
    done: "Listo",
    swap: "Cambiar jugadores",
    resting: "Descansan esta ronda",
    startRound: (n) => `Empezar ronda ${n}`,
    endEvening: "Terminar la noche",
    ended: "La noche ha terminado — la clasificación final está en la pestaña Clasificación.",
    notStarted: "Todavía no ha empezado nada. Empieza la ronda 1 cuando los primeros partidos estén listos.",
    currentRound: (n) => `La ronda ${n} está en pista`,
  },

  court: {
    label: (court) => `Pista ${court}`,
    sameGender: (bands) => `mismo género · ${bands}`,
    void: "Anular",
    voided: "anulado",
    pointsLeft: (court) => `Puntos del equipo de la izquierda en la pista ${court}`,
    pointsRight: (court) => `Puntos del equipo de la derecha en la pista ${court}`,
  },

  standings: {
    heading: "Clasificación",
    lede: "Cada uno suma los puntos que hizo su propio equipo. Un descanso vale la media de la ronda, y una pareja del mismo género suma dos más.",
    empty: "Genera primero un calendario y luego anota los resultados al acabar cada partido.",
    played: (games) => `${games} jugados`,
    bye: (points) => `+${points} descanso`,
    sameGender: (points) => `+${points} mismo género`,
  },

  print: {
    back: "Volver a la app",
    summary: (players, courts, rounds, target, seed) =>
      `${players} jugadores · ${courts} pistas · ${rounds} rondas · partidos a ${target} · semilla ${seed}`,
    empty: "Todavía no se ha generado ningún calendario.",
    round: (round) => `Ronda ${round}`,
    court: "Pista",
    team: "Equipo",
    score: "Resultado",
    resting: "Descansan: ",
    nameJoiner: " y ",
  },

  auth: {
    loginHeading: "Acceso de organizador",
    lede: "Los organizadores preparan las noches y las gestionan desde la pista. Los jugadores nunca necesitan una cuenta.",
    continueWithGoogle: "Continuar con Google",
    logout: "Cerrar sesión",
    error: "No se pudo iniciar sesión con Google. Inténtalo de nuevo.",
  },

  picker: {
    prevMonth: "Mes anterior",
    nextMonth: "Mes siguiente",
    time: "Hora",
    done: "Listo",
  },

  organiser: {
    heading: "Tus noches",
    lede: "Crea una noche, comparte su enlace de inscripción en el grupo y gestiónala desde aquí la noche del evento.",
    newTournament: "Nueva noche",
    empty: "Aún no hay noches. Crea la primera.",
    status: {
      open: "Inscripción abierta",
      closed: "Inscripción cerrada",
      generated: "Calendario listo",
      live: "Noche en curso",
      finished: "Finalizada",
    },
    players: (confirmed: number, max: number) => `${confirmed} / ${max} jugadores`,
    copyLink: "Copiar enlace de inscripción",
    copied: "Enlace copiado",
    open: "Abrir",
    form: {
      heading: "Nueva noche",
      name: "Nombre",
      namePlaceholder: "Dobles mixtos del viernes",
      startsAt: "Empieza",
      maxCourts: "Pistas disponibles",
      perCourt: "Plazas por pista (jugando + descansando)",
      capacity: (courts: number, cap: number) =>
        `${courts} ${courts === 1 ? "pista" : "pistas"} — hasta ${cap} jugadores. Quien se inscriba por encima de eso pasa a la lista de espera, por orden de llegada.`,
      create: "Crear noche",
      invalid: "Revisa los campos: un nombre, una fecha y de 1 a 6 pistas.",
    },
  },

  workspace: {
    unreadable: "No se pudo leer el calendario guardado. Descártalo y genera uno de nuevo.",
    errors: {
      "not-found": "Esta noche ya no existe.",
      invalid: "Ese cambio no era válido y se ignoró.",
      frozen: "El calendario ya está generado; descártalo antes de cambiar la lista.",
      open: "Cierra primero la inscripción.",
      players: "Se necesitan al menos cuatro jugadores confirmados.",
      full: "Esta noche ha alcanzado el límite de inscripciones.",
      state: "Ese paso no está disponible ahora mismo.",
    },
  },

  public: {
    startsAt: (when) => `Empieza ${when}`,
    spots: (confirmed, cap, waiting) =>
      waiting > 0 ? `${confirmed} de ${cap} plazas ocupadas · ${waiting} en espera` : `${confirmed} de ${cap} plazas ocupadas`,
    registerHeading: "¿Te apuntas?",
    registerLede: "Rellena tu nombre una vez; este teléfono te recordará.",
    register: "Apuntarme",
    waitlistWarning: "La noche está completa — entrarías en la lista de espera y subirías cuando alguien cancele.",
    youAreIn: "¡Ya estás dentro!",
    waiting: (n) => `Eres el número ${n} en la lista de espera.`,
    cancel: "Cancelar mi inscripción",
    frozen: "El calendario ya está fijado. Avisa al organizador si no puedes venir.",
    closed: "La inscripción está cerrada.",
    fullMessage: "La inscripción está cerrada — la noche está completamente llena.",
    tabs: { now: "En juego", standings: "Ranking" },
    round: (n) => `Ronda ${n}`,
    yourCourt: (court, partner, a, b) => `Pista ${court} — con ${partner}, contra ${a} y ${b}`,
    youRest: "Descansas esta ronda — vuelves en la siguiente.",
    finalHeading: "Clasificación final",
    notStarted: "El calendario está listo. La primera ronda empieza pronto.",
    errors: {
      invalid: "Introduce un nombre y elige cómo juegas y tu nivel.",
      closed: "La inscripción está cerrada.",
      full: "La noche está completamente llena.",
      already: "Este teléfono ya tiene una inscripción activa para esta noche.",
      failed: "Eso no ha funcionado. Recarga la página e inténtalo de nuevo.",
    },
  },
};
