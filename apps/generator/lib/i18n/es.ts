import type { Messages } from "./en";

export const es: Messages = {
  title: ["Noche de dobles", "mixtos"],
  loading: "Cargando la noche de hoy…",
  headerMeta: (players, courts) => `${players}j · ${courts} ${courts === 1 ? "pista" : "pistas"}`,
  language: "Idioma",
  dismiss: "Cerrar",
  sections: "Secciones",

  tabs: {
    roster: "Jugadores",
    setup: "Ajustes",
    schedule: "Pistas",
    standings: "Ranking",
  },

  storage: {
    blocked: "El navegador está bloqueando el almacenamiento, así que no se restauró nada.",
    corrupt:
      "No se pudo leer la noche guardada y se dejó intacta. Empieza una nueva o corrige la entrada en el almacenamiento del navegador.",
    mismatch:
      "La noche guardada no coincide con lo que espera esta versión. Empieza una nueva o corrige la entrada en el almacenamiento del navegador.",
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
    loading: "Cargando…",
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
    signUpHeading: "Crear una cuenta de organizador",
    lede: "Los organizadores preparan las noches y las gestionan desde la pista. Los jugadores nunca necesitan una cuenta.",
    email: "Correo electrónico",
    password: "Contraseña",
    passwordHint: (min) => `Al menos ${min} caracteres`,
    login: "Iniciar sesión",
    signUp: "Crear cuenta",
    logout: "Cerrar sesión",
    toSignUp: "¿Aún no tienes cuenta? Crea una",
    toLogin: "¿Ya tienes cuenta? Inicia sesión",
    confirmEmail: "Revisa tu bandeja de entrada y confirma tu correo, luego inicia sesión.",
    errors: {
      invalid: "Introduce un correo válido y una contraseña de al menos 8 caracteres.",
      credentials: "Ese correo y contraseña no coinciden.",
      exists: "Ya existe una cuenta con ese correo. Inicia sesión en su lugar.",
      failed: "No se pudo crear la cuenta. Inténtalo de nuevo en un momento.",
    },
  },

  organiser: {
    heading: "Tus noches",
    lede: "Crea una noche, comparte su enlace de inscripción en el grupo y gestiónala desde aquí la noche del evento.",
    newTournament: "Nueva noche",
    empty: "Aún no hay noches. Crea la primera.",
    status: { open: "Inscripción abierta", closed: "Inscripción cerrada", generated: "Calendario listo" },
    players: (confirmed: number, max: number) => `${confirmed} / ${max} jugadores`,
    copyLink: "Copiar enlace de inscripción",
    copied: "Enlace copiado",
    open: "Abrir",
    form: {
      heading: "Nueva noche",
      name: "Nombre",
      namePlaceholder: "Dobles mixtos del viernes",
      startsAt: "Empieza",
      maxPlayers: "Jugadores máximos",
      maxPlayersHint: "Las inscripciones por encima de este número pasan a la lista de espera, por orden de llegada.",
      maxCourts: "Pistas disponibles",
      rounds: "Rondas",
      gameTarget: "Los partidos se juegan a",
      create: "Crear noche",
      invalid: "Revisa los campos resaltados: nombre, una fecha futura, 4–64 jugadores, 1–6 pistas, 1–20 rondas.",
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
    },
  },
};
