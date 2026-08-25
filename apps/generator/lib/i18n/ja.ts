import type { Messages } from "./en";

export const ja: Messages = {
  title: ["ミックス", "ダブルス"],
  language: "言語",
  menu: "メニュー",
  dismiss: "閉じる",
  sections: "セクション",

  tabs: {
    roster: "名簿",
    schedule: "コート",
    standings: "順位",
    rules: "ルール",
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
    heading: "今日のメンバーは？",
    lede: "レベルは登録時に本人が選んだ区分です。この画面にだけ表示され、イベントの間に名前の横に出ることはありません。",
    name: "名前",
    namePlaceholder: "プレーヤーを追加",
    playsAs: "性別",
    level: "レベル",
    count: (_players, men, women) => `人 · 男性 ${men} · 女性 ${women}`,
    empty: "まだ誰もいません。上から最初のプレーヤーを追加してください。",
    remove: "削除",
    edit: "編集",
    save: "保存",
    cancelEdit: "キャンセル",
    guestOf: (host) => `${host} さんの +1`,
    confirmedCount: (confirmed, max) => `確定 ${confirmed} / ${max} 枠`,
    waitingHeading: "キャンセル待ち",
    frozen: "イベントが開始されたため名簿は固定されています。変更するには受付に戻ってください。",
    registrationOpen: "受付中",
    registrationClosed: "受付を締め切りました",
    startEvent: "イベントを開始",
    drawing: "スケジュールを作成中…",
    drawingDetail: "1000通りの組み合わせを試して最良のものを選びます。",
    backToRegistration: "受付に戻る",
  },

  setup: {
    courts: "コート数",
    rounds: "ラウンド数",
    restSlots: "休憩枠",
    scheduler: "組み合わせ方式",
    gameTarget: "1ゲームの得点",
    points: (points) => `${points} 点`,
    roundMinutes: "ラウンドの制限時間",
    noClock: "時計なし",
    minutes: (n) => `${n} 分`,
    roundMinutesHint: "次のラウンド開始時に、終わっていない試合は切り上げます。リードしているチームを目標点まで上げ、相手チームにも同じ点を足します（5–8 は 8–11 として扱います）。",
    seed: "シード",
    reroll: "振り直す",
    capacity: (onCourt, resting) => `各ラウンド ${onCourt} 人がコートに入り、${resting} 人が休憩します。`,
    needPlayers: "開始するには確定した参加者が 4 人以上必要です。",
    quality: "スケジュールの質",
    qualityLede:
      "アルゴリズムスコア（SPEC-2）。評価するのはスケジュールであってプレーヤーではなく、ここにしか表示されません。",
    waived: "免除",
    diagnostics: (partnerRepeat, opponentStreak, byeSpread, blowoutPercent) =>
      `同じペアの最大回数 ${partnerRepeat} · 同じ相手との最長連続 ${opponentStreak} · 休憩回数の差 ${byeSpread} · 大差試合の割合 ${blowoutPercent}%`,
    suggested: "コート数と休憩枠は確定したプレーヤー数に応じて提案されます。",
    useSuggestion: "提案値を使う",
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
    heading: "本日のコート",
    empty: "スケジュールはまだありません。全員そろったら名簿タブからイベントを開始してください。",
    print: "印刷",
    adjust: "スケジュールを調整",
    rounds: "ラウンド",
    roundChip: (round) => `R${round}`,
    allRounds: "すべて",
    roundOf: (round, total) => `ラウンド ${round} / ${total}`,
    resting: "今回は休憩",
    startRound: (n) => `ラウンド ${n} を開始`,
    confirmRound: (n) => `ラウンド ${n} を確定`,
    ended: "イベントは終了しました — 最終順位は「順位」タブでご覧いただけます。",
    notStarted: "まだ何も始まっていません。最初のゲームの準備ができたらラウンド1を開始してください。",
    currentRound: (n) => `ラウンド ${n} を進行中`,
  },

  clock: {
    label: "ラウンドタイマー",
    start: (minutes) => `${minutes} 分のタイマーを開始`,
    running: (minutes) => `／${minutes} 分`,
    timeUp: "時間切れです。ラリーを終えてスコアを報告してください。",
    stop: "停止",
    reset: "クリア",
  },

  rules: {
    heading: "得点の仕組み",
    lede: "順位はすべてコートで入力されたスコアから計算されます。手作業の判断はありません。",
    points: {
      title: "ゲームの得点",
      body: (target) => `ゲームは ${target} 点先取です。勝っても負けても、自分のチームが取った点がそのまま得点になります。`,
      example: (target) => `${target}–${Math.max(0, target - 4)} で終了：勝者は各 ${target} 点、敗者は各 ${Math.max(0, target - 4)} 点。`,
    },
    clock: {
      title: "制限時間",
      body: (minutes, target) => `各ラウンドは ${minutes} 分です。次のラウンドを確定するとき、終わっていないゲームは切り上げます。リードしているチームを ${target} 点にし、相手チームにも同じ点を足すので点差は変わりません。`,
      example: (minutes, target) => `5–8 で時間切れ：${target - 3}–${target} として扱います。`,
    },
    bye: {
      title: "休憩",
      body: "休憩するラウンドは、そのラウンドにプレーした全員の平均点をもらえます。休憩で損をすることも、プレーより得をすることもありません。",
      example: "コートの得点が 11, 11, 5, 5, 11, 11, 9, 9 → 平均 9 なので、休憩した人は各 +9。",
    },
    sameGender: {
      title: "同性ペア",
      body: "人数の都合で同性ペアになった場合、そのゲームは +2 点です。",
      example: "男性2人のペアが 7 点：それぞれ 7 + 2。",
    },
    ranking: {
      title: "順位",
      body: "合計点が高い順です。同点は得失点差（自分のチームの得点 − 相手の得点）で決め、それも同じなら同順位です。",
      example: "61 点の2人：得失点差 +12 が +4 より上位。",
    },
  },

  court: {
    label: (court) => `コート ${court}`,
    sameGender: (bands) => `同性ペア · ${bands}`,
    void: "無効",
    voided: "無効",
    countsAs: (score) => `時間切れのため ${score} として計算。`,
    roundedFrom: (score) => `時間切れで ${score} から切り上げ。`,
    pointsLeft: (court) => `コート ${court} 左側チームの得点`,
    pointsRight: (court) => `コート ${court} 右側チームの得点`,
  },

  standings: {
    heading: "順位",
    lede: "全員、自分のチームが取った点がそのまま得点になります。休憩はそのラウンドの平均点、同性ペアはさらに2点加算されます。同点の場合は得失点差で順位を決め、合計の下に表示します。",
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
    lede: "主催者は当日の設定とコート運営を行います。参加者にアカウントは必要ありません。",
    continueWithGoogle: "Google で続行",
    logout: "ログアウト",
    error: "Google でログインできませんでした。もう一度お試しください。",
  },

  picker: {
    prevMonth: "前の月",
    nextMonth: "次の月",
    hour: "時",
    minutes: "分",
    done: "完了",
  },

  organiser: {
    heading: "主催するイベント",
    lede: "イベントを作成し、サインアップ用のリンクをグループチャットで共有して、当日はここから運営します。",
    newTournament: "新しいイベントを作成",
    empty: "まだイベントがありません。最初のイベントを作成してください。",
    status: {
      open: "受付中",
      closed: "受付終了",
      generated: "スケジュール作成済み",
      live: "開催中",
      finished: "終了",
    },
    players: (confirmed: number, max: number) => `${confirmed} / ${max} 人`,
    copyLink: "招待をコピー",
    inviteMessage: (name, when, url) => `${when}、「${name}」を開催します！登録とイベントの確認はこちら：${url}`,
    copied: "リンクをコピーしました",
    open: "開く",
    form: {
      heading: "新しいイベントを作成",
      name: "名前",
      namePlaceholder: "金曜ミックスダブルス",
      location: "場所（任意）",
      locationPlaceholder: "Balanca Pickleball Court",
      startsAt: "開始日時",
      maxCourts: "利用可能なコート数",
      perCourt: "コートあたりの枠（プレー + 休憩）",
      capacity: (courts: number, cap: number) =>
        `コート${courts}面 — 最大${cap}人まで。それを超える申し込みはキャンセル待ちになります（先着順）。`,
      create: "イベントを作成",
      invalid: "項目を確認してください：名前、日付、1〜6面のコート。",
    },
    edit: {
      open: "編集",
      heading: "イベントを編集",
      save: "変更を保存",
      cancel: "キャンセル",
      signedUp: (n) => `すでに ${n} 人が登録済みです。`,
      demote: (n) => `登録済みの ${n} 人がキャンセル待ちに移ります。`,
      notify: (n) => `定員が減り、${n} 人がキャンセル待ちに移りました。グループチャットで知らせて、全員に参加状況を確認してもらいましょう。`,
      notifyPromoted: "キャンセル待ちから繰り上がった人がいます。グループチャットで知らせて、参加できることを伝えましょう。",
      copyUpdate: "グループ用メッセージをコピー",
      updateDemoted: (name, url) => `「${name}」のお知らせ：定員を減らしたため、参加確定リストが変わりました。参加状況をご確認ください：${url}`,
      updatePromoted: (name, url) => `「${name}」のお知らせ：空きが出て、キャンセル待ちからの繰り上がりがありました。参加状況はこちらでご確認ください：${url}`,
    },
  },

  workspace: {
    unreadable: "保存されたスケジュールを読み込めませんでした。破棄してから作り直してください。",
    errors: {
      "not-found": "このイベントはもう存在しません。",
      invalid: "その変更は無効だったため、無視されました。",
      frozen: "イベントは開始済みです。名簿を変更するには受付に戻ってください。",
      open: "先に受付を締め切ってください。",
      players: "確定したプレーヤーが4人以上必要です。",
      full: "このイベントは受付上限に達しています。",
      state: "その操作は今は行えません。",
    },
  },

  public: {
    startsAt: (when) => `開始 ${when}`,
    playedTo: (n) => `試合は ${n} 点先取`,
    timeLimit: (n) => `各ラウンド ${n} 分。時間切れの試合は切り上げます。`,
    spots: (confirmed, cap, waiting) =>
      waiting > 0
        ? `定員${cap}人中${confirmed}人が申し込み済み · キャンセル待ち${waiting}人`
        : `定員${cap}人中${confirmed}人が申し込み済み`,
    registerHeading: "参加しますか？",
    registerLede: "名前を一度入力すれば、このスマートフォンが記憶します。",
    register: "申し込む",
    registerGroup: "まとめて登録",
    waitlistWarning: "このイベントは満員です——申し込むとキャンセル待ちになり、空きが出次第繰り上がります。",
    youAreIn: "参加登録できました！",
    registeredAs: (name, when) => `${name} として登録 · ${when}`,
    signedUpHeading: (n) => `参加者（${n}人）`,
    nobodyYet: "まだ誰も登録していません。最初の一人になりましょう。",
    you: "あなた",
    yourGuest: "あなたの +1",
    waiting: (n) => `キャンセル待ち${n}番目です。`,
    cancel: "申し込みを取り消す",
    cancelGroup: "全員の申し込みを取り消す",
    addGuest: "+1 を追加",
    addGuestSubmit: "追加",
    guestHeading: "+1 を連れて行く",
    guestLede: "あなたの名前で登録され、通常の登録と同じ扱いです。",
    guestConfirmed: "参加確定",
    guestNumber: (n) => `+1（${n} 人目）`,
    guestWaiting: (n) => `キャンセル待ち ${n} 番`,
    frozen: "スケジュールが確定しています。参加できない場合は主催者に連絡してください。",
    closed: "受付は終了しました。",
    fullMessage: "受付は終了しました——このイベントは満員です。",
    round: (n) => `ラウンド ${n}`,
    yourCourt: (court, partner, a, b) => `コート ${court} — ${partner}とペア、対戦相手は${a}・${b}`,
    youRest: "このラウンドは休憩です — 次のラウンドで復帰します。",
    finalHeading: "最終順位",
    notStarted: "スケジュールの準備ができました。まもなく第1ラウンドが始まります。",
    errors: {
      invalid: "名前を入力し、プレースタイルとレベルを選んでください。",
      closed: "受付は終了しました。",
      full: "このイベントは満員です。",
      already: "このスマートフォンはすでにこのイベントに申し込み済みです。",
      guestLimit: "1 件の登録で追加できる +1 の上限に達しました。",
      failed: "うまくいきませんでした。ページを更新してもう一度お試しください。",
    },
  },
};
