import type { Messages } from "./en";

export const es: Messages = {
  title: ["Dobles", "mixtos"],
  language: "Idioma",
  menu: "Menú",
  dismiss: "Cerrar",
  sections: "Secciones",

  /** La página pública /levels: nuestros seis niveles frente a la escala común de 1.0 a 5.5. */
  levelGuide: {
    heading: "Qué significan los niveles",
    lede: "Cada inscripción lleva un nivel elegido por el propio jugador, y el programador lo usa para equilibrar las pistas. El pickleball usa una escala de 1.0 a 5.5; la agrupamos en seis niveles para que elegir sea rápido.",
    howToPick: "Elige el nivel que te describe en una tarde normal, no en tu mejor día. ¿Entre dos? Toma el más bajo. ¿Tienes rating DUPR? Usa el rango junto a cada nivel.",
    rating: (range: string) => `Rating ${range}`,
    tiers: {
      1: {
        range: "1.0–2.0",
        summary: "Recién empiezas. Todavía aprendes las reglas, el saque y dónde colocarte.",
        skills: [
          "Los peloteos son cortos; el objetivo es pasar la bola por encima de la red.",
          "El saque y el resto no son fiables.",
          "Aún no conoces bien las reglas de la cocina ni cómo se canta el marcador.",
        ],
      },
      2: {
        range: "2.5",
        summary: "Conoces las reglas y mantienes un peloteo corto con bola lenta.",
        skills: [
          "El saque y el resto entran la mayoría de las veces.",
          "Juegas sobre todo desde el fondo; el tercer golpe corto y el dink son nuevos.",
          "Conoces lo básico de la colocación en dobles.",
        ],
      },
      3: {
        range: "3.0",
        summary: "Aguantas un peloteo a ritmo medio y sabes dónde estar en dobles.",
        skills: [
          "Saque y resto fiables, con algo de profundidad.",
          "Subes a la línea de la cocina y empiezas a hacer dinks y dejadas, aún sin mucha regularidad.",
          "Voleas las bolas fáciles; todavía cometes errores no forzados bajo presión.",
        ],
      },
      4: {
        range: "3.5",
        summary: "Cómodo en la línea de la cocina: dinks, dejadas y voleas con cierto control.",
        skills: [
          "Usas el tercer golpe corto a propósito y varías el ritmo.",
          "Mantienes peloteos de dinks y esperas la bola atacable.",
          "Te comunicas con tu pareja y os movéis como equipo.",
        ],
      },
      5: {
        range: "4.0",
        summary: "Controlas los peloteos con paciencia e intención, y cometes pocos errores no forzados.",
        skills: [
          "Dinks, dejadas, drives y resets a voluntad, con efecto y colocación.",
          "Lees al rival, castigas las bolas altas y eliges el momento de atacar.",
          "Defiendes intercambios rápidos y bloqueas drives fuertes.",
        ],
      },
      6: {
        range: "4.5 o más",
        summary: "Nivel de torneo: fiable bajo presión y sólido en todos los golpes.",
        skills: [
          "Juegas con estrategia, no solo puntos: anticipas, construyes y rematas.",
          "Neutralizas los ataques y rara vez regalas un peloteo.",
          "Adaptas estilo y ritmo a los rivales al otro lado de la red.",
        ],
      },
    },
  },

  tabs: {
    roster: "Jugadores",
    schedule: "Pistas",
    standings: "Ranking",
    rules: "Reglas",
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
    lede: "El nivel es el que cada uno eligió al inscribirse. Se muestra en la lista de inscritos y en el ranking, nunca en las pistas.",
    name: "Nombre",
    namePlaceholder: "Añadir jugador",
    playsAs: "Juega como",
    level: "Nivel",
    count: (players, men, women) => `${players === 1 ? "jugador" : "jugadores"} · ${men} h · ${women} m`,
    empty: "Todavía no hay nadie en la lista. Añade al primer jugador arriba.",
    remove: "Quitar",
    edit: "Editar",
    save: "Guardar",
    cancelEdit: "Cancelar",
    guestOf: (host) => `+1 de ${host}`,
    confirmedCount: (confirmed, max) => `${confirmed} de ${max} plazas ocupadas`,
    waitingHeading: "Lista de espera",
    frozen: "El evento ha comenzado, así que la lista está congelada. Usa Volver a la inscripción para cambiarla.",
    registrationOpen: "La inscripción está abierta",
    registrationClosed: "La inscripción está cerrada",
    startEvent: "Iniciar evento",
    drawing: "Generando el calendario…",
    drawingDetail: "Probando mil sorteos y quedándonos con el mejor.",
    backToRegistration: "Volver a la inscripción",
  },

  setup: {
    courts: "Pistas",
    rounds: "Rondas",
    restSlots: "Descansos",
    scheduler: "Algoritmo",
    gameTarget: "Los partidos se juegan a",
    points: (points) => `${points} puntos`,
    roundMinutes: "Límite de tiempo por ronda",
    noClock: "Sin reloj",
    minutes: (n) => `${n} minutos`,
    roundMinutesHint: "Al empezar la siguiente ronda, un partido sin terminar se redondea: el equipo que va ganando sube al objetivo y el otro sube lo mismo, así 5–8 cuenta como 8–11.",
    seed: "Semilla",
    reroll: "Cambiar",
    capacity: (onCourt, resting) => `${onCourt} en pista cada ronda, ${resting} descansando.`,
    needPlayers: "Se necesitan al menos cuatro jugadores confirmados para empezar.",
    quality: "Calidad del calendario",
    qualityLede:
      "La puntuación del algoritmo (SPEC-2). Juzga el calendario, nunca a un jugador, y solo se muestra aquí.",
    waived: "exento",
    diagnostics: (partnerRepeat, opponentStreak, byeSpread, blowoutPercent) =>
      `Máx. repetición de pareja ${partnerRepeat} · racha más larga contra el mismo rival ${opponentStreak} · diferencia de descansos ${byeSpread} · partidos desiguales ${blowoutPercent}%`,
    suggested: "Las pistas y los descansos siguen el número de jugadores confirmados.",
    useSuggestion: "Usar la sugerencia",
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
    heading: "Pistas del evento",
    empty: "Aún no hay calendario. Inicia el evento desde la pestaña Lista cuando todos estén dentro.",
    print: "Imprimir",
    adjust: "Ajustar calendario",
    rounds: "Rondas",
    roundChip: (round) => `R${round}`,
    allRounds: "Todas",
    roundOf: (round, total) => `Ronda ${round} de ${total}`,
    resting: "Descansan esta ronda",
    startRound: (n) => `Empezar ronda ${n}`,
    confirmRound: (n) => `Confirmar ronda ${n}`,
    ended: "El evento ha terminado — la clasificación final está en la pestaña Clasificación.",
    notStarted: "Todavía no ha empezado nada. Empieza la ronda 1 cuando los primeros partidos estén listos.",
    currentRound: (n) => `La ronda ${n} está en pista`,
  },

  clock: {
    label: "Reloj de la ronda",
    start: (minutes) => `Iniciar el reloj de ${minutes} minutos`,
    running: (minutes) => `de ${minutes} minutos restantes`,
    timeUp: "Se acabó el tiempo: terminad el punto y traed el resultado.",
    stop: "Parar",
    reset: "Borrar",
  },

  rules: {
    heading: "Cómo se puntúa",
    lede: "Todo lo que ves en el ranking sale de los resultados anotados en pista. Nada se juzga a mano.",
    points: {
      title: "Puntos de partido",
      body: (target) => `Los partidos se juegan a ${target}. Sumas los puntos que hizo tu propio equipo, ganes o pierdas.`,
      example: (target) => `Un partido acaba ${target}–${Math.max(0, target - 4)}: los ganadores suman ${target} cada uno, los perdedores ${Math.max(0, target - 4)}.`,
    },
    clock: {
      title: "El reloj",
      body: (minutes, target) => `Cada ronda dura ${minutes} minutos. Al confirmar la siguiente ronda, un partido sin terminar se redondea: el equipo que va ganando sube a ${target} y el otro sube lo mismo, así se mantiene la diferencia.`,
      example: (minutes, target) => `Se acaba el tiempo con 5–8: cuenta como ${target - 3}–${target}.`,
    },
    bye: {
      title: "Descanso",
      body: "Una ronda sin jugar se llama “bye”; el ranking lo muestra como “+n bye”. Cuando descansas una ronda recibes la media de lo que anotaron todos los que jugaron esa ronda: descansar nunca te perjudica ni supera a jugar.",
      example: "Las pistas anotaron 11, 11, 5, 5, 11, 11, 9, 9 → la media es 9, así que cada uno que descansa suma +9.",
    },
    ranking: {
      title: "Ranking",
      body: "La noche celebra a la mejor mujer y al mejor hombre: las tres mejores mujeres y los tres mejores hombres van encima de la lista. Gana el total más alto. Los empates se deshacen por diferencia de puntos: los que anotaron tus equipos menos los que te anotaron. Si también empatan, se comparte el puesto.",
      example: "Dos jugadores con 61: +12 de diferencia queda por delante de +4.",
    },
  },

  court: {
    label: (court) => `Pista ${court}`,
    sameGender: (bands) => `mismo género · ${bands}`,
    void: "Anular",
    voided: "anulado",
    countsAs: (score) => `Cuenta como ${score}: se acabó el tiempo.`,
    roundedFrom: (score) => `Redondeado desde ${score} al acabar el tiempo.`,
    pointsLeft: (court) => `Puntos del equipo de la izquierda en la pista ${court}`,
    pointsRight: (court) => `Puntos del equipo de la derecha en la pista ${court}`,
  },

  standings: {
    heading: "Clasificación",
    lede: "Cada uno suma los puntos que hizo su propio equipo. Un descanso vale la media de la ronda. Los empates se deshacen por diferencia de puntos, que aparece bajo el total.",
    empty: "Genera primero un calendario y luego anota los resultados al acabar cada partido.",
    played: (games) => `${games} jugados`,
    bye: (points) => `+${points} descanso`,
    bestHeading: "Lo mejor de la noche",
    bestLede: "Las tres mujeres y los tres hombres con más puntos esta noche.",
    top: { women: "Mejores mujeres", men: "Mejores hombres" },
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
    lede: "Los organizadores preparan los eventos y las gestionan desde la pista. Los jugadores nunca necesitan una cuenta.",
    continueWithGoogle: "Continuar con Google",
    logout: "Cerrar sesión",
    error: "No se pudo iniciar sesión con Google. Inténtalo de nuevo.",
  },

  picker: {
    prevMonth: "Mes anterior",
    nextMonth: "Mes siguiente",
    hour: "Hora",
    minutes: "Minutos",
    done: "Listo",
  },

  organiser: {
    heading: "Tus eventos",
    lede: "Crea un evento, comparte su enlace de inscripción en el grupo y gestiónalo desde aquí el día del evento.",
    newTournament: "Nuevo evento",
    empty: "Aún no hay eventos. Crea el primero.",
    status: {
      open: "Inscripción abierta",
      closed: "Inscripción cerrada",
      generated: "Calendario listo",
      live: "Evento en curso",
      finished: "Finalizada",
    },
    players: (confirmed: number, max: number) => `${confirmed} / ${max} jugadores`,
    copyLink: "Copiar invitación",
    inviteMessage: (name, when, url) => `¡Apúntate a ${name} el ${when}! Inscríbete y sigue el evento aquí: ${url}`,
    copied: "Enlace copiado",
    open: "Abrir",
    form: {
      heading: "Nuevo evento",
      name: "Nombre",
      namePlaceholder: "Dobles mixtos del viernes",
      location: "Ubicación (opcional)",
      locationPlaceholder: "Balanca Pickleball Court",
      startsAt: "Empieza",
      maxCourts: "Pistas disponibles",
      perCourt: "Plazas por pista (jugando + descansando)",
      capacity: (courts: number, cap: number) =>
        `${courts} ${courts === 1 ? "pista" : "pistas"} — hasta ${cap} jugadores. Quien se inscriba por encima de eso pasa a la lista de espera, por orden de llegada.`,
      minLevel: "Nivel mínimo",
      anyLevel: "Cualquier nivel",
      minLevelHint: "Cada jugador elige su nivel al inscribirse. Con un mínimo fijado, los niveles inferiores no pueden inscribirse.",
      create: "Crear evento",
      invalid: "Revisa los campos: un nombre, una fecha y de 1 a 6 pistas.",
    },
    edit: {
      open: "Editar",
      heading: "Editar evento",
      save: "Guardar cambios",
      cancel: "Cancelar",
      signedUp: (n) => `Ya hay ${n} inscritos.`,
      demote: (n) => (n === 1 ? "1 inscrito pasaría a la lista de espera." : `${n} inscritos pasarían a la lista de espera.`),
      notify: (n) => (n === 1 ? "La capacidad bajó: 1 inscrito pasó a la lista de espera. Avisa en el grupo para que todos comprueben si conservan su plaza." : `La capacidad bajó: ${n} inscritos pasaron a la lista de espera. Avisa en el grupo para que todos comprueben si conservan su plaza.`),
      notifyPromoted: "Alguien subió de la lista de espera. Avisa en el grupo para que sepa que ya está dentro.",
      copyUpdate: "Copiar mensaje para el grupo",
      updateDemoted: (name, url) => `Actualización de ${name}: hemos tenido que reducir la capacidad y la lista de confirmados cambió. Comprueba si conservas tu plaza: ${url}`,
      updatePromoted: (name, url) => `Actualización de ${name}: se liberó una plaza y alguien subió de la lista de espera. Comprueba tu estado aquí: ${url}`,
    },
  },

  workspace: {
    unreadable: "No se pudo leer el calendario guardado. Descártalo y genera uno de nuevo.",
    errors: {
      "not-found": "Este evento ya no existe.",
      invalid: "Ese cambio no era válido y se ignoró.",
      frozen: "El evento ha comenzado; vuelve a la inscripción antes de cambiar la lista.",
      open: "Cierra primero la inscripción.",
      players: "Se necesitan al menos cuatro jugadores confirmados.",
      full: "Este evento ha alcanzado el límite de inscripciones.",
      state: "Ese paso no está disponible ahora mismo.",
    },
  },

  public: {
    startsAt: (when) => `Empieza ${when}`,
    playedTo: (n) => `Los partidos se juegan a ${n} puntos`,
    timeLimit: (n) => `con ${n} minutos por ronda; un partido sin terminar al acabar el tiempo se redondea.`,
    spots: (confirmed, cap, waiting) =>
      waiting > 0 ? `${confirmed} de ${cap} plazas ocupadas · ${waiting} en espera` : `${confirmed} de ${cap} plazas ocupadas`,
    registerHeading: "¿Te apuntas?",
    registerLede: "Rellena tu nombre una vez; este teléfono te recordará.",
    register: "Apuntarme",
    registerGroup: "Apúntanos",
    waitlistWarning: "El evento está completo — entrarías en la lista de espera y subirías cuando alguien cancele.",
    youAreIn: "¡Ya estás dentro!",
    registeredAs: (name, when) => `Inscrito como ${name} · ${when}`,
    signedUpHeading: (n) => `Asistentes (${n})`,
    nobodyYet: "Nadie se ha inscrito todavía. Sé el primero.",
    you: "tú",
    yourGuest: "tu +1",
    waiting: (n) => `Eres el número ${n} en la lista de espera.`,
    cancel: "Cancelar mi inscripción",
    cancelGroup: "Cancelar nuestra inscripción",
    addGuest: "Añadir un +1",
    addGuestSubmit: "Añadir",
    guestHeading: "Trae un +1",
    guestLede: "Se apunta a tu nombre y cuenta como cualquier inscripción.",
    guestConfirmed: "Dentro",
    guestNumber: (n) => `+1 n.º ${n}`,
    guestWaiting: (n) => `En espera n.º ${n}`,
    frozen: "El calendario ya está fijado. Avisa al organizador si no puedes venir.",
    closed: "La inscripción está cerrada.",
    fullMessage: "La inscripción está cerrada — el evento está completamente lleno.",
    round: (n) => `Ronda ${n}`,
    yourCourt: (court, partner, a, b) => `Pista ${court} — con ${partner}, contra ${a} y ${b}`,
    youRest: "Descansas esta ronda — vuelves en la siguiente.",
    notStarted: "El calendario está listo. La primera ronda empieza pronto.",
    notSure: "No estoy seguro",
    notSureHint: "Elige un nivel para inscribirte. ¿No sabes cuál encaja?",
    levelsLink: "Mira qué significan los niveles",
    minLevel: (level: string) => `Esta tarde es para ${level} en adelante.`,
    errors: {
      invalid: "Introduce un nombre y elige cómo juegas y tu nivel.",
      level: "Este evento tiene un nivel mínimo. Revisa el nivel elegido para cada jugador.",
      closed: "La inscripción está cerrada.",
      full: "El evento está completamente lleno.",
      already: "Este teléfono ya tiene una inscripción activa para este evento.",
      guestLimit: "Has alcanzado el límite de +1 por inscripción.",
      failed: "Eso no ha funcionado. Recarga la página e inténtalo de nuevo.",
    },
  },
};
