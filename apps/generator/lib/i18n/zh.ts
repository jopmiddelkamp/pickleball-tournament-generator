import type { Messages } from "./en";

/** Simplified Chinese */
export const zh: Messages = {
  title: ["混双", "之夜"],
  loading: "正在加载今晚的活动…",
  headerMeta: (players, courts) => `${players}人 · ${courts}片场地`,
  language: "语言",
  dismiss: "关闭",
  sections: "栏目",

  tabs: {
    roster: "名单",
    setup: "设置",
    schedule: "场地",
    standings: "排名",
  },

  storage: {
    blocked: "浏览器禁止使用本地存储，未能恢复任何内容。",
    corrupt: "保存的活动无法读取，已原样保留。请开始新的活动，或修复浏览器存储中的条目。",
    mismatch: "保存的活动与当前版本不匹配。请开始新的活动，或修复浏览器存储中的条目。",
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
    lede: "级别是大家报名时自选的档位，只显示在这个页面上——整晚都不会出现在名字旁边。",
    name: "姓名",
    namePlaceholder: "添加球员",
    playsAs: "性别",
    level: "级别",
    add: "添加球员",
    full: (max) => `名单已满，最多 ${max} 人。`,
    count: (_players, men, women) => `人 · 男 ${men} · 女 ${women}`,
    empty: "名单还是空的。请在上方添加第一位球员。",
    remove: "移除",
  },

  setup: {
    heading: "设置今晚的活动",
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
    startOver: "开始新的活动",
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
    heading: "今晚的场地",
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
    loading: "加载中…",
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
    signUpHeading: "创建组织者账户",
    lede: "组织者负责安排活动之夜并在场边运营。选手无需注册账户。",
    email: "邮箱",
    password: "密码",
    passwordHint: (min) => `至少 ${min} 个字符`,
    login: "登录",
    signUp: "创建账户",
    logout: "退出登录",
    toSignUp: "还没有账户？创建一个",
    toLogin: "已有账户？去登录",
    confirmEmail: "请查收邮箱并确认邮箱地址，然后登录。",
    errors: {
      invalid: "请输入有效的邮箱地址和至少 8 个字符的密码。",
      credentials: "邮箱或密码不正确。",
      exists: "该邮箱已注册账户，请直接登录。",
      failed: "无法创建账户，请稍后重试。",
    },
  },
};
