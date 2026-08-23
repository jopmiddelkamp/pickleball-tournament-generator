import type { Messages } from "./en";

export const ko: Messages = {
  title: ["혼합복식", "나이트"],
  language: "언어",
  dismiss: "닫기",
  sections: "섹션",

  tabs: {
    roster: "명단",
    setup: "설정",
    schedule: "코트",
    standings: "순위",
  },

  levels: {
    1: "초급",
    2: "초급+",
    3: "중급",
    4: "중급+",
    5: "고급",
    6: "고급+",
  },

  bands: { 0: "하", 1: "중", 2: "상" },

  gender: { F: "여성", M: "남성" },

  roster: {
    heading: "누가 참가하나요?",
    lede: "레벨은 등록할 때 본인이 고른 단계입니다. 이 화면에만 표시되며, 저녁 내내 이름 옆에는 나타나지 않습니다.",
    name: "이름",
    namePlaceholder: "참가자 추가",
    playsAs: "성별",
    level: "레벨",
    add: "참가자 추가",
    full: (max) => `명단이 가득 찼습니다. 최대 ${max}명입니다.`,
    count: (_players, men, women) => `명 · 남 ${men} · 여 ${women}`,
    empty: "아직 아무도 없습니다. 위에서 첫 참가자를 추가하세요.",
    remove: "삭제",
    confirmedCount: (confirmed, max) => `${confirmed} / ${max}자리 확정`,
    waitingHeading: "대기 명단",
    position: (n) => `#${n}`,
    frozen: "일정이 생성되어 명단이 잠겼습니다. 변경하려면 설정 탭에서 일정을 삭제하세요.",
    registrationOpen: "등록이 진행 중입니다",
    registrationClosed: "등록이 마감되었습니다",
    closeRegistration: "등록 마감",
    openRegistration: "등록 다시 열기",
    walkIn: "현장 참가자 추가",
  },

  setup: {
    heading: "오늘 저녁 설정",
    lede: "같은 참가자, 설정, 시드에서는 항상 같은 일정이 나옵니다. 다른 일정을 원하면 시드를 다시 뽑으세요.",
    courts: "코트 수",
    rounds: "라운드 수",
    restSlots: "휴식 인원",
    scheduler: "편성 방식",
    gameTarget: "게임 목표 점수",
    points: (points) => `${points}점`,
    seed: "시드",
    reroll: "다시 뽑기",
    capacity: (onCourt, resting) => `라운드마다 ${onCourt}명이 코트에 서고 ${resting}명이 쉽니다.`,
    needPlayers: "일정을 만들려면 참가자가 4명 이상 필요합니다.",
    generate: "일정 생성",
    quality: "일정 품질",
    qualityLede:
      "알고리즘 점수(SPEC-2)입니다. 참가자가 아니라 일정을 평가하며, 여기에만 표시됩니다.",
    waived: "면제",
    diagnostics: (partnerRepeat, opponentStreak, byeSpread, blowoutPercent) =>
      `같은 파트너 최대 ${partnerRepeat}회 · 같은 상대 최장 연속 ${opponentStreak}라운드 · 휴식 횟수 차이 ${byeSpread} · 일방적 경기 비율 ${blowoutPercent}%`,
    noScore: "일정을 생성하면 점수를 볼 수 있습니다.",
    suggested: "코트 수와 휴식 인원은 확정된 참가자 수에 따라 제안됩니다.",
    useSuggestion: "제안값 사용",
    closeFirst: "생성하기 전에 등록을 마감해서 명단이 더 이상 바뀌지 않게 하세요.",
    discard: "일정 삭제",
  },

  grades: {
    excellent: "우수",
    good: "양호",
    weak: "미흡",
    fail: "불합격",
  },

  laws: {
    L1: "혼합 팀을 낭비하지 않음",
    L2: "같은 사람과 세 번째 파트너가 되지 않음",
    L3: "같은 상대와 3라운드 연속 맞붙지 않음",
  },

  algorithms: {
    random: {
      name: "무작위",
      description: "라운드마다 전원을 섞어 짝을 짓습니다. 다른 방식을 비교하는 기준입니다.",
    },
    circle: {
      name: "서클",
      description: "고전적인 휘스트 휠: 한 자리는 고정하고 나머지는 라운드마다 회전하며, 마주 보는 자리가 파트너가 됩니다.",
    },
    latin: {
      name: "라틴 회전",
      description: "남녀를 두 줄로 세우고 라운드마다 한 칸씩 밀어, 모든 혼합 짝이 한 번씩 나옵니다.",
    },
    greedy: {
      name: "그리디 매칭",
      description:
        "가능한 모든 짝과 경기를 신선함, 혼합, 레벨로 점수 매긴 뒤 라운드마다 가장 잘 맞는 조합을 고릅니다.",
    },
  },

  schedule: {
    heading: "오늘 저녁 코트",
    empty: "아직 일정이 없습니다. 참가자를 추가한 뒤 설정 탭에서 생성하세요.",
    print: "인쇄",
    rounds: "라운드",
    roundChip: (round) => `R${round}`,
    roundOf: (round, total) => `라운드 ${round} / ${total}`,
    tapToMove: "옮길 참가자를 누르세요.",
    tapTarget: "이제 자리를 바꿀 상대를 누르세요.",
    scores: (score) => `일정 점수 ${score}.`,
    scoresBroken: (score, laws) => `일정 점수 ${score}, ${laws} 위반.`,
    lawJoiner: "와 ",
    done: "완료",
    swap: "참가자 교체",
    resting: "이번 라운드 휴식",
  },

  court: {
    label: (court) => `코트 ${court}`,
    sameGender: (bands) => `동성 팀 · ${bands}`,
    void: "무효",
    voided: "무효",
    pointsLeft: (court) => `코트 ${court} 왼쪽 팀 점수`,
    pointsRight: (court) => `코트 ${court} 오른쪽 팀 점수`,
  },

  standings: {
    heading: "순위",
    lede: "모두 자기 팀이 낸 점수를 그대로 받습니다. 휴식은 그 라운드 평균 점수를, 동성 팀은 추가로 2점을 받습니다.",
    empty: "먼저 일정을 생성한 뒤, 경기가 끝날 때마다 점수를 입력하세요.",
    played: (games) => `${games}경기`,
    bye: (points) => `휴식 +${points}`,
    sameGender: (points) => `동성 팀 +${points}`,
  },

  print: {
    loading: "불러오는 중…",
    back: "앱으로 돌아가기",
    summary: (players, courts, rounds, target, seed) =>
      `${players}명 · 코트 ${courts}개 · ${rounds}라운드 · ${target}점 게임 · 시드 ${seed}`,
    empty: "아직 생성된 일정이 없습니다.",
    round: (round) => `라운드 ${round}`,
    court: "코트",
    team: "팀",
    score: "점수",
    resting: "휴식: ",
    nameJoiner: " & ",
  },

  auth: {
    loginHeading: "주최자 로그인",
    signUpHeading: "주최자 계정 만들기",
    lede: "주최자는 저녁 일정을 설정하고 코트에서 직접 진행합니다. 참가자는 계정이 필요 없습니다.",
    email: "이메일",
    password: "비밀번호",
    passwordHint: (min) => `${min}자 이상`,
    login: "로그인",
    signUp: "계정 만들기",
    logout: "로그아웃",
    toSignUp: "아직 계정이 없나요? 계정 만들기",
    toLogin: "이미 계정이 있나요? 로그인",
    confirmEmail: "받은 편지함에서 이메일을 확인하고 인증한 뒤 로그인하세요.",
    errors: {
      invalid: "유효한 이메일과 8자 이상의 비밀번호를 입력하세요.",
      credentials: "이메일과 비밀번호가 일치하지 않습니다.",
      exists: "이미 해당 이메일로 등록된 계정이 있습니다. 로그인해 주세요.",
      failed: "계정을 만들 수 없습니다. 잠시 후 다시 시도하세요.",
    },
  },

  organiser: {
    heading: "주최하는 저녁",
    lede: "저녁 일정을 만들고, 가입 링크를 단체 채팅방에 공유한 뒤, 당일 저녁에는 여기서 진행하세요.",
    newTournament: "새 저녁 만들기",
    empty: "아직 저녁 일정이 없습니다. 첫 일정을 만들어 보세요.",
    status: { open: "등록 진행 중", closed: "등록 마감", generated: "일정 완성" },
    players: (confirmed: number, max: number) => `${confirmed} / ${max}명`,
    copyLink: "가입 링크 복사",
    copied: "링크 복사됨",
    open: "열기",
    form: {
      heading: "새 저녁 만들기",
      name: "이름",
      namePlaceholder: "금요일 혼합 복식",
      startsAt: "시작 시간",
      maxPlayers: "최대 인원",
      maxPlayersHint: "이 인원을 초과한 신청은 선착순으로 대기 명단에 올라갑니다.",
      maxCourts: "이용 가능한 코트 수",
      rounds: "라운드 수",
      gameTarget: "경기 목표 점수",
      create: "저녁 만들기",
      invalid: "강조 표시된 항목을 확인하세요: 이름, 미래의 날짜, 4~64명, 코트 1~6개, 라운드 1~20회.",
    },
  },

  workspace: {
    unreadable: "저장된 일정을 읽을 수 없습니다. 삭제하고 다시 생성하세요.",
    errors: {
      "not-found": "이 저녁 일정은 더 이상 존재하지 않습니다.",
      invalid: "그 변경 사항은 유효하지 않아 무시되었습니다.",
      frozen: "일정이 생성되어 있습니다. 명단을 바꾸려면 먼저 일정을 삭제하세요.",
      open: "먼저 등록을 마감하세요.",
      players: "확정된 참가자가 최소 4명 필요합니다.",
      full: "이 저녁 일정은 등록 인원 한도에 도달했습니다.",
    },
  },
};
