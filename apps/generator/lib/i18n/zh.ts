import type { Messages } from "./en";

/** Simplified Chinese */
export const zh: Messages = {
  title: ["混合", "双打"],
  language: "语言",
  menu: "菜单",
  dismiss: "关闭",
  sections: "栏目",

  tabs: {
    roster: "名单",
    setup: "设置",
    schedule: "场地",
    standings: "排名",
  },

  levels: {
    1: "初级",
    2: "初级+",
    3: "中级",
    4: "中级+",
    5: "高级",
    6: "高级+",
  },

  bands: { 0: "低", 1: "中", 2: "高" },

  gender: { F: "女", M: "男" },

  roster: {
    heading: "谁来打球？",
    lede: "级别是大家报名时自选的档位，只显示在这个页面上——全程都不会出现在名字旁边。",
    name: "姓名",
    namePlaceholder: "添加球员",
    playsAs: "性别",
    level: "级别",
    add: "添加球员",
    full: (max) => `名单已满，最多 ${max} 人。`,
    count: (_players, men, women) => `人 · 男 ${men} · 女 ${women}`,
    empty: "名单还是空的。请在上方添加第一位球员。",
    remove: "移除",
    confirmedCount: (confirmed, max) => `已确认 ${confirmed} / ${max} 位`,
    waitingHeading: "候补名单",
    position: (n) => `第 ${n} 位`,
    frozen: "赛程已生成，名单已锁定。请在“设置”页丢弃赛程后再修改。",
    registrationOpen: "报名进行中",
    registrationClosed: "报名已关闭",
    closeRegistration: "关闭报名",
    openRegistration: "重新开放报名",
    walkIn: "添加现场球员",
  },

  setup: {
    heading: "设置本场活动",
    lede: "相同的球员、设置和种子始终生成相同的赛程。想换一个，就重新生成种子。",
    courts: "场地数",
    rounds: "轮数",
    restSlots: "轮空名额",
    scheduler: "排程算法",
    gameTarget: "每局打到",
    points: (points) => `${points} 分`,
    seed: "种子",
    reroll: "重新生成",
    capacity: (onCourt, resting) => `每轮 ${onCourt} 人上场，${resting} 人轮空。`,
    needPlayers: "至少添加四位球员后才能生成赛程。",
    generate: "生成赛程",
    quality: "赛程质量",
    qualityLede: "算法评分（SPEC-2）。它只评价赛程，不评价任何球员，并且只在这里显示。",
    waived: "免除",
    diagnostics: (partnerRepeat, opponentStreak, byeSpread, blowoutPercent) =>
      `最多重复搭档 ${partnerRepeat} 次 · 最长连续同对手 ${opponentStreak} 轮 · 轮空差距 ${byeSpread} · 悬殊对局占比 ${blowoutPercent}%`,
    noScore: "生成赛程后即可查看评分。",
    suggested: "场地数和轮空名额会随已确认球员人数自动建议。",
    useSuggestion: "采用建议值",
    closeFirst: "生成前请先关闭报名，这样名单就不会再变动。",
    discardFirst: "赛程已生成。请先丢弃它才能生成新的赛程。",
    discard: "丢弃赛程",
  },

  grades: {
    excellent: "优秀",
    good: "良好",
    weak: "较弱",
    fail: "不合格",
  },

  laws: {
    L1: "不浪费混双组合",
    L2: "不与同一人第三次搭档",
    L3: "不连续三轮对阵同一对手",
  },

  algorithms: {
    random: {
      name: "随机",
      description: "每轮随机打乱所有人再两两配对。其他算法都以它为基准。",
    },
    circle: {
      name: "圆桌轮转",
      description: "经典的惠斯特轮转：一个座位固定，其余每轮轮换，相对的座位结为搭档。",
    },
    latin: {
      name: "拉丁轮转",
      description: "男女各站一排，每轮错开一位，让每个混双组合都出现一次。",
    },
    greedy: {
      name: "贪心匹配",
      description: "按新鲜度、混合度和级别给每个可能的搭档和对局打分，每轮选出最合适的组合。",
    },
  },

  schedule: {
    heading: "本场活动的场地",
    empty: "还没有赛程。先添加球员，再到“设置”页生成。",
    print: "打印",
    rounds: "轮次",
    roundChip: (round) => `第${round}轮`,
    roundOf: (round, total) => `第 ${round} 轮，共 ${total} 轮`,
    tapToMove: "点一位球员以移动。",
    tapTarget: "再点与之交换位置的球员。",
    scores: (score) => `赛程得分 ${score}。`,
    scoresBroken: (score, laws) => `赛程得分 ${score}，${laws} 已被打破。`,
    lawJoiner: "和",
    done: "完成",
    swap: "交换球员",
    resting: "本轮轮空",
    startRound: (n) => `开始第 ${n} 轮`,
    endEvent: "结束活动",
    ended: "活动已结束 — 最终排名在“排名”页查看。",
    notStarted: "还没有开始。第一场比赛准备好后就开始第 1 轮吧。",
    currentRound: (n) => `第 ${n} 轮进行中`,
  },

  court: {
    label: (court) => `${court} 号场`,
    sameGender: (bands) => `同性组合 · ${bands}`,
    void: "作废",
    voided: "作废",
    pointsLeft: (court) => `${court} 号场左侧队伍的得分`,
    pointsRight: (court) => `${court} 号场右侧队伍的得分`,
  },

  standings: {
    heading: "排名",
    lede: "每个人获得自己队伍打出的分数。轮空按该轮平均分计，同性组合额外加两分。",
    empty: "先生成赛程，然后在每局结束后录入比分。",
    played: (games) => `已打 ${games} 局`,
    bye: (points) => `轮空 +${points}`,
    sameGender: (points) => `同性组合 +${points}`,
  },

  print: {
    back: "返回应用",
    summary: (players, courts, rounds, target, seed) =>
      `${players} 人 · ${courts} 片场地 · ${rounds} 轮 · 每局 ${target} 分 · 种子 ${seed}`,
    empty: "还没有生成赛程。",
    round: (round) => `第 ${round} 轮`,
    court: "场地",
    team: "队伍",
    score: "比分",
    resting: "轮空：",
    nameJoiner: " 和 ",
  },

  auth: {
    loginHeading: "组织者登录",
    lede: "组织者负责安排活动并在场边运营。选手无需注册账户。",
    continueWithGoogle: "使用 Google 继续",
    logout: "退出登录",
    error: "无法通过 Google 登录，请重试。",
  },

  picker: {
    prevMonth: "上个月",
    nextMonth: "下个月",
    hour: "时",
    minutes: "分",
    done: "完成",
  },

  organiser: {
    heading: "你的活动",
    lede: "创建一场活动，把报名链接分享到群里，当天就在这里运营。",
    newTournament: "新建活动",
    empty: "还没有活动。创建第一场吧。",
    status: {
      open: "开放报名",
      closed: "报名已关闭",
      generated: "赛程已生成",
      live: "活动进行中",
      finished: "已结束",
    },
    players: (confirmed: number, max: number) => `${confirmed} / ${max} 名球员`,
    copyLink: "复制报名链接",
    copied: "链接已复制",
    open: "打开",
    form: {
      heading: "新建活动",
      name: "名称",
      namePlaceholder: "周五混双",
      startsAt: "开始时间",
      maxCourts: "可用场地数",
      perCourt: "每片场地名额（上场 + 轮休）",
      capacity: (courts: number, cap: number) =>
        `${courts} 片场地 — 最多可容纳 ${cap} 名球员。超出人数将进入候补名单，先到先得。`,
      create: "创建活动",
      invalid: "请检查以下字段：名称、日期、以及 1–6 片场地。",
    },
  },

  workspace: {
    unreadable: "无法读取已保存的赛程。请丢弃后重新生成。",
    errors: {
      "not-found": "这场活动已不存在。",
      invalid: "该操作无效，已被忽略。",
      frozen: "赛程已生成；请先丢弃赛程再修改名单。",
      open: "请先关闭报名。",
      players: "至少需要四位已确认球员。",
      full: "本场活动的报名人数已达上限。",
      state: "该操作目前不可用。",
    },
  },

  public: {
    startsAt: (when) => `开始时间 ${when}`,
    spots: (confirmed, cap, waiting) =>
      waiting > 0 ? `已占 ${cap} 个名额中的 ${confirmed} 个 · ${waiting} 人候补` : `已占 ${cap} 个名额中的 ${confirmed} 个`,
    registerHeading: "要一起打吗？",
    registerLede: "填一次姓名即可；这部手机会记住你。",
    register: "报名参加",
    waitlistWarning: "本场活动名额已满——你将进入候补名单，有人取消后自动递补。",
    youAreIn: "你已报名成功！",
    waiting: (n) => `你目前是候补名单第 ${n} 位。`,
    cancel: "取消我的报名",
    frozen: "赛程已经确定。如果你不能来，请告知组织者。",
    closed: "报名已关闭。",
    fullMessage: "报名已关闭——本场活动名额已满。",
    tabs: { now: "正在进行", standings: "排名" },
    round: (n) => `第 ${n} 轮`,
    yourCourt: (court, partner, a, b) => `${court} 号场 — 搭档 ${partner}，对阵 ${a} 和 ${b}`,
    youRest: "本轮轮空——下一轮回归。",
    finalHeading: "最终排名",
    notStarted: "赛程已准备好，第一轮即将开始。",
    errors: {
      invalid: "请输入姓名，并选择你的打法和级别。",
      closed: "报名已关闭。",
      full: "本场活动名额已满。",
      already: "这部手机已经为本场活动报名过了。",
      failed: "操作未成功，请刷新页面重试。",
    },
  },
};
