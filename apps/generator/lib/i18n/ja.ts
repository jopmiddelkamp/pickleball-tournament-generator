import type { Messages } from "./en";

export const ja: Messages = {
  title: ["ミックスダブルス", "ナイト"],
  loading: "今夜のデータを読み込み中…",
  headerMeta: (players, courts) => `${players}人 · ${courts}コート`,
  language: "言語",
  dismiss: "閉じる",
  sections: "セクション",

  tabs: {
    roster: "名簿",
    setup: "設定",
    schedule: "コート",
    standings: "順位",
  },

  storage: {
    blocked: "ブラウザがストレージをブロックしているため、何も復元できませんでした。",
    corrupt:
      "保存されたデータを読み込めなかったため、そのまま残してあります。新しく始めるか、ブラウザのストレージ項目を修正してください。",
    mismatch:
      "保存されたデータがこのバージョンの形式と一致しません。新しく始めるか、ブラウザのストレージ項目を修正してください。",
  },

  levels: {
    1: "初心者",
    2: "初心者+",
    3: "中級",
    4: "中級+",
    5: "上級",
    6: "上級+",
  },

  bands: { 0: "低", 1: "中", 2: "高" },

  gender: { F: "女性", M: "男性" },

  roster: {
    heading: "今夜のメンバーは？",
    lede: "レベルは登録時に本人が選んだ区分です。この画面にだけ表示され、今夜の間に名前の横に出ることはありません。",
    name: "名前",
    namePlaceholder: "プレーヤーを追加",
    playsAs: "性別",
    level: "レベル",
    add: "プレーヤーを追加",
    full: (max) => `名簿は ${max} 人で満員です。`,
    count: (_players, men, women) => `人 · 男性 ${men} · 女性 ${women}`,
    empty: "まだ誰もいません。上から最初のプレーヤーを追加してください。",
    remove: "削除",
  },

  setup: {
    heading: "今夜の設定",
    lede: "同じメンバー・設定・シードからは常に同じスケジュールが生まれます。別のものにするにはシードを振り直してください。",
    courts: "コート数",
    rounds: "ラウンド数",
    restSlots: "休憩枠",
    scheduler: "組み合わせ方式",
    gameTarget: "1ゲームの得点",
    points: (points) => `${points} 点`,
    seed: "シード",
    reroll: "振り直す",
    capacity: (onCourt, resting) => `各ラウンド ${onCourt} 人がコートに入り、${resting} 人が休憩します。`,
    needPlayers: "生成するには4人以上のプレーヤーが必要です。",
    generate: "スケジュールを生成",
    quality: "スケジュールの質",
    qualityLede:
      "アルゴリズムスコア（SPEC-2）。評価するのはスケジュールであってプレーヤーではなく、ここにしか表示されません。",
    waived: "免除",
    diagnostics: (partnerRepeat, opponentStreak, byeSpread, blowoutPercent) =>
      `同じペアの最大回数 ${partnerRepeat} · 同じ相手との最長連続 ${opponentStreak} · 休憩回数の差 ${byeSpread} · 大差試合の割合 ${blowoutPercent}%`,
    noScore: "スケジュールを生成するとスコアが表示されます。",
    startOver: "新しい夜を始める",
  },

  grades: {
    excellent: "優秀",
    good: "良好",
    weak: "弱い",
    fail: "不合格",
  },

  laws: {
    L1: "ミックスペアを無駄にしない",
    L2: "同じ相手と3回目のペアを組まない",
    L3: "同じ相手と3ラウンド連続で対戦しない",
  },

  algorithms: {
    random: {
      name: "ランダム",
      description: "毎ラウンド全員をシャッフルしてペアにします。他の方式を測る基準です。",
    },
    circle: {
      name: "サークル",
      description: "定番のホイスト方式：1席を固定し、残りが毎ラウンド回転、向かい合う席がペアになります。",
    },
    latin: {
      name: "ラテン回転",
      description: "男性と女性を2列に並べ、毎ラウンド1つずつずらして、すべてのミックスペアが1回ずつ組まれます。",
    },
    greedy: {
      name: "貪欲マッチング",
      description:
        "考えられるすべてのペアと対戦を新鮮さ・ミックス・レベルで採点し、毎ラウンド最適な組み合わせを選びます。",
    },
  },

  schedule: {
    heading: "今夜のコート",
    empty: "まだスケジュールがありません。プレーヤーを追加して、「設定」タブから生成してください。",
    print: "印刷",
    rounds: "ラウンド",
    roundChip: (round) => `R${round}`,
    roundOf: (round, total) => `ラウンド ${round} / ${total}`,
    tapToMove: "動かすプレーヤーをタップしてください。",
    tapTarget: "次に、入れ替える相手をタップしてください。",
    scores: (score) => `スケジュールのスコアは ${score} です。`,
    scoresBroken: (score, laws) => `スケジュールのスコアは ${score}、${laws} が破られています。`,
    lawJoiner: "と",
    done: "完了",
    swap: "プレーヤーを入れ替え",
    resting: "今回は休憩",
  },

  court: {
    label: (court) => `コート ${court}`,
    sameGender: (bands) => `同性ペア · ${bands}`,
    void: "無効",
    voided: "無効",
    pointsLeft: (court) => `コート ${court} 左側チームの得点`,
    pointsRight: (court) => `コート ${court} 右側チームの得点`,
  },

  standings: {
    heading: "順位",
    lede: "全員、自分のチームが取った点がそのまま得点になります。休憩はそのラウンドの平均点、同性ペアはさらに2点加算されます。",
    empty: "先にスケジュールを生成し、ゲームが終わるごとにスコアを入力してください。",
    played: (games) => `${games} ゲーム`,
    bye: (points) => `休憩 +${points}`,
    sameGender: (points) => `同性ペア +${points}`,
  },

  print: {
    loading: "読み込み中…",
    back: "アプリに戻る",
    summary: (players, courts, rounds, target, seed) =>
      `${players} 人 · ${courts} コート · ${rounds} ラウンド · ${target} 点先取 · シード ${seed}`,
    empty: "スケジュールはまだ生成されていません。",
    round: (round) => `ラウンド ${round}`,
    court: "コート",
    team: "チーム",
    score: "スコア",
    resting: "休憩：",
    nameJoiner: " & ",
  },
};
