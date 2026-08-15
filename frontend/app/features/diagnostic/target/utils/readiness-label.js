const READINESS_COPY = {
  READY: {
    label: 'Sẵn sàng',
    message: 'Bạn có thể cân nhắc đăng ký thi nếu duy trì kết quả ổn định.',
  },
  ALMOST_READY: {
    label: 'Gần sẵn sàng',
    message: 'Tập trung sửa lỗi sai và làm final check.',
  },
  NEEDS_IMPROVEMENT: {
    label: 'Cần cải thiện',
    message: 'Bạn gần đạt nhưng còn lĩnh vực yếu có thể kéo tụt điểm.',
  },
  NOT_READY: {
    label: 'Chưa sẵn sàng',
    message: 'Bạn cần củng cố nền tảng trước khi làm mock tiếp.',
  },
};

const READINESS_CLASS = {
  READY: 'readinessReady',
  ALMOST_READY: 'readinessAlmost',
  NEEDS_IMPROVEMENT: 'readinessNeeds',
  NOT_READY: 'readinessNotReady',
};

// Bậc Quick Challenge  duyệt từ cao xuống, lấy bậc đầu tiên đạt min.
const QUICK_CHALLENGE_TIERS = [
  { min: 85, level: 'EXCELLENT', title: 'Xuất sắc' },
  { min: 60, level: 'GOOD', title: 'Khá tốt' },
  { min: 30, level: 'FAIR', title: 'Tạm ổn' },
  { min: 0, level: 'WEAK', title: 'Cần luyện thêm' },
];

const NEXT_READINESS_STEP = 10;

function readinessCopy(level) {
  return READINESS_COPY[level] || READINESS_COPY.NOT_READY;
}

export function getReadinessLabel(level) {
  if (!level) return '—';
  return readinessCopy(level).label;
}

export function getReadinessMessage(level) {
  if (!level) return null;
  return readinessCopy(level).message;
}

export function getReadinessClassName(level, pageCx) {
  const key = READINESS_CLASS[level] || 'readinessNotReady';
  return pageCx(key);
}

/** Dựng dữ liệu hiển thị cho card gauge từ facts của enhanced result. */
export function buildGaugeView(enhanced) {
  const {
    examCategoryCode, percentage, hasTarget, targetScore,
    totalScore, readinessScore, readinessLevel,
  } = enhanced;

  if (examCategoryCode === 'QUICK_CHALLENGE') {
    const pct = percentage ?? 0;
    const tier = QUICK_CHALLENGE_TIERS.find((t) => pct >= t.min)
      ?? QUICK_CHALLENGE_TIERS[QUICK_CHALLENGE_TIERS.length - 1];
    return {
      gaugePercentage: pct,
      displayValue: `${pct}%`,
      gaugeLabel: 'Độ chính xác',
      gaugeTitle: tier.title,
      gaugeMessage: null,
      gaugeLevel: tier.level,
    };
  }

  if (hasTarget && targetScore != null) {
    const ts = totalScore ?? 0;
    const targetMet = ts >= targetScore;
    return {
      gaugePercentage: Math.min(100, Math.round((ts / targetScore) * 100)),
      displayValue: `${ts}/${targetScore}`,
      gaugeLabel: 'Mục tiêu',
      gaugeTitle: targetMet ? 'Đạt mục tiêu!' : 'Chưa đạt mục tiêu',
      gaugeMessage: targetMet
        ? `Chúc mừng! Bạn đã đạt mức điểm mục tiêu ${targetScore} đề ra.`
        : `Bạn còn thiếu ${targetScore - ts} điểm nữa để đạt mục tiêu.`,
      gaugeLevel: null,
    };
  }

  const score = readinessScore ?? 0;
  const copy = readinessCopy(readinessLevel);
  return {
    gaugePercentage: score,
    displayValue: `${score}%`,
    gaugeLabel: 'Độ sẵn sàng',
    gaugeTitle: copy.label,
    gaugeMessage: copy.message,
    gaugeLevel: null,
  };
}

/** Text cho khối "Việc cần làm ngay"; null = không có gì cần nhắc. */
export function buildRecoveryMessage({ hasTarget, isTargetMet, readinessScore, readinessLevel }) {
  if (hasTarget && isTargetMet !== true) {
    return 'Mục tiêu của bạn: Lấp đầy khoảng trống kiến thức để đạt target. '
      + 'Hãy lập kế hoạch học để luyện tập theo những phần thi bạn chưa đạt mục tiêu đề ra.';
  }
  if (!hasTarget && readinessLevel !== 'READY') {
    const score = readinessScore ?? 0;
    const next = Math.min(score + NEXT_READINESS_STEP, 100);
    return `Mục tiêu: tăng độ sẵn sàng từ ${score}% lên ${next}%. `
      + 'Hãy đặt mục tiêu điểm và aim từng phần thi để hệ thống gợi ý lộ trình phù hợp.';
  }
  return null;
}
