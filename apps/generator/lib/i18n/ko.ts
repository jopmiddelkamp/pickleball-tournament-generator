import type { Messages } from "./en";

export const ko: Messages = {
  title: ["혼합복식", "나이트"],
  loading: "오늘 저녁 데이터를 불러오는 중…",
  headerMeta: (players, courts) => `${players}명 · 코트 ${courts}개`,
  language: "언어",
  dismiss: "닫기",
  sections: "섹션",

  tabs: {
    roster: "명단",
    setup: "설정",
    schedule: "코트",
    standings: "순위",
  },

  storage: {
    blocked: "브라우저가 저장소를 차단하고 있어 아무것도 복원하지 못했습니다.",
    corrupt:
      "저장된 데이터를 읽을 수 없어 그대로 두었습니다. 새로 시작하거나 브라우저 저장소 항목을 수정하세요.",
    mismatch:
      "저장된 데이터가 이 버전의 형식과 맞지 않습니다. 새로 시작하거나 브라우저 저장소 항목을 수정하세요.",
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
    startOver: "새 저녁 시작",
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
};
