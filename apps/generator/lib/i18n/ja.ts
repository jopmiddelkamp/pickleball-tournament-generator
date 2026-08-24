import type { Messages } from "./en";

export const ja: Messages = {
  title: ["ミックスダブルス", "ナイト"],
  language: "言語",
  dismiss: "閉じる",
  sections: "セクション",

  tabs: {
    roster: "名簿",
    setup: "設定",
    schedule: "コート",
    standings: "順位",
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
    confirmedCount: (confirmed, max) => `確定 ${confirmed} / ${max} 枠`,
    waitingHeading: "キャンセル待ち",
    position: (n) => `${n}番目`,
    frozen: "スケジュールが生成されているため、名簿はロックされています。変更するには「設定」タブでスケジュールを破棄してください。",
    registrationOpen: "受付中",
    registrationClosed: "受付を締め切りました",
    closeRegistration: "受付を締め切る",
    openRegistration: "受付を再開する",
    walkIn: "飛び入り参加者を追加",
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
    suggested: "コート数と休憩枠は確定したプレーヤー数に応じて提案されます。",
    useSuggestion: "提案値を使う",
    closeFirst: "生成する前に受付を締め切り、名簿が変わらないようにしてください。",
    discardFirst: "スケジュールはすでに生成されています。新しいスケジュールを生成するには、先に破棄してください。",
    discard: "スケジュールを破棄",
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
    startRound: (n) => `ラウンド ${n} を開始`,
    endEvening: "今夜を終了",
    ended: "今夜は終了しました — 最終順位は「順位」タブでご覧いただけます。",
    notStarted: "まだ何も始まっていません。最初のゲームの準備ができたらラウンド1を開始してください。",
    currentRound: (n) => `ラウンド ${n} を進行中`,
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

  auth: {
    loginHeading: "主催者ログイン",
    signUpHeading: "主催者アカウントを作成",
    lede: "主催者は当日の設定とコート運営を行います。参加者にアカウントは必要ありません。",
    email: "メールアドレス",
    password: "パスワード",
    passwordHint: (min) => `${min} 文字以上`,
    login: "ログイン",
    signUp: "アカウントを作成",
    logout: "ログアウト",
    toSignUp: "アカウントをお持ちでない方はこちら",
    toLogin: "すでにアカウントをお持ちの方はこちら",
    confirmEmail: "受信トレイを確認してメールを認証してから、ログインしてください。",
    errors: {
      invalid: "有効なメールアドレスと8文字以上のパスワードを入力してください。",
      credentials: "メールアドレスとパスワードが一致しません。",
      exists: "そのメールアドレスのアカウントはすでに存在します。ログインしてください。",
      failed: "アカウントを作成できませんでした。しばらくしてからもう一度お試しください。",
    },
  },

  organiser: {
    heading: "主催する夜",
    lede: "夜の予定を作成し、サインアップ用のリンクをグループチャットで共有して、当日はここから運営します。",
    newTournament: "新しい夜を作成",
    empty: "まだ夜の予定がありません。最初の予定を作成してください。",
    status: {
      open: "受付中",
      closed: "受付終了",
      generated: "スケジュール作成済み",
      live: "開催中",
      finished: "終了",
    },
    players: (confirmed: number, max: number) => `${confirmed} / ${max} 人`,
    copyLink: "サインアップリンクをコピー",
    copied: "リンクをコピーしました",
    open: "開く",
    form: {
      heading: "新しい夜を作成",
      name: "名前",
      namePlaceholder: "金曜ミックスダブルス",
      startsAt: "開始日時",
      maxCourts: "利用可能なコート数",
      capacity: (courts: number, cap: number) =>
        `コート${courts}面 — 最大${cap}人まで。それを超える申し込みはキャンセル待ちになります（先着順）。`,
      create: "夜を作成",
      invalid: "項目を確認してください：名前、日付、1〜6面のコート。",
    },
  },

  workspace: {
    unreadable: "保存されたスケジュールを読み込めませんでした。破棄してから作り直してください。",
    errors: {
      "not-found": "この夜の予定はもう存在しません。",
      invalid: "その変更は無効だったため、無視されました。",
      frozen: "スケジュールが生成されています。名簿を変更する前に破棄してください。",
      open: "先に受付を締め切ってください。",
      players: "確定したプレーヤーが4人以上必要です。",
      full: "この夜の予定は受付上限に達しています。",
      state: "その操作は今は行えません。",
    },
  },
};
