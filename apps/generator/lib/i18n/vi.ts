import type { Messages } from "./en";

export const vi: Messages = {
  title: ["Đêm đánh đôi", "nam nữ"],
  loading: "Đang tải buổi tối nay…",
  headerMeta: (players, courts) => `${players} người · ${courts} sân`,
  language: "Ngôn ngữ",
  dismiss: "Đóng",
  sections: "Các mục",

  tabs: {
    roster: "Danh sách",
    setup: "Thiết lập",
    schedule: "Sân",
    standings: "Xếp hạng",
  },

  storage: {
    blocked: "Trình duyệt đang chặn bộ nhớ, nên không khôi phục được gì.",
    corrupt:
      "Không đọc được buổi tối đã lưu, dữ liệu được giữ nguyên. Hãy bắt đầu buổi mới, hoặc sửa mục lưu trong trình duyệt.",
    mismatch:
      "Buổi tối đã lưu không khớp với phiên bản này. Hãy bắt đầu buổi mới, hoặc sửa mục lưu trong trình duyệt.",
  },

  levels: {
    1: "Mới chơi",
    2: "Mới chơi+",
    3: "Trung bình",
    4: "Trung bình+",
    5: "Nâng cao",
    6: "Nâng cao+",
  },

  bands: { 0: "thấp", 1: "trung", 2: "cao" },

  gender: { F: "Nữ", M: "Nam" },

  roster: {
    heading: "Ai sẽ chơi?",
    lede: "Trình độ là bậc mọi người tự chọn khi đăng ký. Nó chỉ hiện ở màn hình này — không ai thấy nó cạnh tên trong suốt buổi tối.",
    name: "Tên",
    namePlaceholder: "Thêm người chơi",
    playsAs: "Giới tính",
    level: "Trình độ",
    add: "Thêm người chơi",
    full: (max) => `Danh sách đã đầy, tối đa ${max} người.`,
    count: (_players, men, women) => `người chơi · ${men} nam · ${women} nữ`,
    empty: "Chưa có ai trong danh sách. Hãy thêm người chơi đầu tiên ở trên.",
    remove: "Xóa",
  },

  setup: {
    heading: "Thiết lập buổi tối",
    lede: "Cùng người chơi, cài đặt và seed luôn cho ra cùng một lịch. Đổi seed để có lịch khác.",
    courts: "Số sân",
    rounds: "Số vòng",
    restSlots: "Suất nghỉ",
    scheduler: "Thuật toán xếp lịch",
    gameTarget: "Mỗi ván chơi đến",
    points: (points) => `${points} điểm`,
    seed: "Seed",
    reroll: "Đổi seed",
    capacity: (onCourt, resting) => `Mỗi vòng ${onCourt} người trên sân, ${resting} người nghỉ.`,
    needPlayers: "Cần ít nhất bốn người chơi trước khi tạo lịch.",
    generate: "Tạo lịch thi đấu",
    quality: "Chất lượng lịch",
    qualityLede:
      "Điểm thuật toán (SPEC-2). Nó đánh giá lịch thi đấu, không bao giờ đánh giá người chơi, và chỉ hiện ở đây.",
    waived: "miễn",
    diagnostics: (partnerRepeat, opponentStreak, byeSpread, blowoutPercent) =>
      `Lặp đồng đội tối đa ${partnerRepeat} · chuỗi gặp cùng đối thủ dài nhất ${opponentStreak} · chênh lệch lượt nghỉ ${byeSpread} · tỷ lệ trận chênh lệch ${blowoutPercent}%`,
    noScore: "Tạo lịch để xem điểm của nó.",
    startOver: "Bắt đầu buổi tối mới",
  },

  grades: {
    excellent: "xuất sắc",
    good: "tốt",
    weak: "yếu",
    fail: "không đạt",
  },

  laws: {
    L1: "Không bỏ phí cặp nam nữ",
    L2: "Không ghép cặp lần thứ ba",
    L3: "Không gặp cùng đối thủ 3 vòng liên tiếp",
  },

  algorithms: {
    random: {
      name: "Ngẫu nhiên",
      description: "Xáo trộn mọi người mỗi vòng rồi ghép cặp. Mốc chuẩn để so với các thuật toán khác.",
    },
    circle: {
      name: "Vòng tròn",
      description:
        "Bánh xe whist cổ điển: một chỗ cố định, những chỗ còn lại xoay mỗi vòng, chỗ đối diện thành đồng đội.",
    },
    latin: {
      name: "Xoay vòng Latin",
      description: "Nam và nữ xếp hai hàng, dịch một chỗ mỗi vòng, để mọi cặp nam nữ đều xuất hiện một lần.",
    },
    greedy: {
      name: "Ghép tham lam",
      description:
        "Chấm điểm mọi cặp và mọi trận có thể theo độ mới, độ pha trộn và trình độ, rồi chọn phương án tốt nhất mỗi vòng.",
    },
  },

  schedule: {
    heading: "Sân tối nay",
    empty: "Chưa có lịch. Hãy thêm người chơi, rồi tạo lịch ở mục Thiết lập.",
    print: "In",
    rounds: "Các vòng",
    roundChip: (round) => `V${round}`,
    roundOf: (round, total) => `Vòng ${round} / ${total}`,
    tapToMove: "Chạm vào một người chơi để chuyển chỗ.",
    tapTarget: "Giờ chạm vào người sẽ đổi chỗ với họ.",
    scores: (score) => `Lịch đạt ${score} điểm.`,
    scoresBroken: (score, laws) => `Lịch đạt ${score} điểm, ${laws} vừa bị vi phạm.`,
    lawJoiner: " và ",
    done: "Xong",
    swap: "Đổi chỗ người chơi",
    resting: "Nghỉ vòng này",
  },

  court: {
    label: (court) => `Sân ${court}`,
    sameGender: (bands) => `cùng giới · ${bands}`,
    void: "Hủy",
    voided: "đã hủy",
    pointsLeft: (court) => `Điểm của đội bên trái trên sân ${court}`,
    pointsRight: (court) => `Điểm của đội bên phải trên sân ${court}`,
  },

  standings: {
    heading: "Bảng xếp hạng",
    lede: "Mỗi người nhận số điểm đội mình ghi được. Lượt nghỉ được tính bằng điểm trung bình của vòng, và đội cùng giới được cộng thêm hai.",
    empty: "Tạo lịch trước, rồi nhập tỷ số khi các ván kết thúc.",
    played: (games) => `${games} ván`,
    bye: (points) => `+${points} nghỉ`,
    sameGender: (points) => `+${points} cùng giới`,
  },

  print: {
    loading: "Đang tải…",
    back: "Quay lại ứng dụng",
    summary: (players, courts, rounds, target, seed) =>
      `${players} người chơi · ${courts} sân · ${rounds} vòng · ván đến ${target} · seed ${seed}`,
    empty: "Chưa tạo lịch nào.",
    round: (round) => `Vòng ${round}`,
    court: "Sân",
    team: "Đội",
    score: "Tỷ số",
    resting: "Nghỉ: ",
    nameJoiner: " & ",
  },
};
