import type { EnhancedResultResponse } from '@/app/types';

type ReadinessCopy = { label: string; message: string };

const READINESS_COPY: Record<string, ReadinessCopy> = {
  READY: {
    label: 'Sẵn sàng',
    message: 'Bạn có thể cân nhắc đăng ký thi nếu duy trì kết quả ổn định.',
  },
  ALMOST_READY: {
    label: 'Gần sẵn sàng',
    message: 'Tập trung sửa các lỗi hay sai và làm thêm một đề thi thử để chắc chắn.',
  },
  NEEDS_IMPROVEMENT: {
    label: 'Cần cải thiện',
    message: 'Bạn gần đạt nhưng còn lĩnh vực yếu có thể kéo tụt điểm.',
  },
  NOT_READY: {
    label: 'Chưa sẵn sàng',
    message: 'Bạn cần củng cố nền tảng trước khi làm đề thi thử tiếp.',
  },
};

const READINESS_CLASS: Record<string, string> = {
  READY: 'readinessReady',
  ALMOST_READY: 'readinessAlmost',
  NEEDS_IMPROVEMENT: 'readinessNeeds',
  NOT_READY: 'readinessNotReady',
};

const QUICK_CHALLENGE_TIERS = [
  { min: 85, level: 'EXCELLENT', title: 'Xuất sắc' },
  { min: 60, level: 'GOOD', title: 'Khá tốt' },
  { min: 30, level: 'FAIR', title: 'Tạm ổn' },
  { min: 0, level: 'WEAK', title: 'Cần luyện thêm' },
];

const NEXT_READINESS_STEP = 10;

function readinessCopy(level?: string | null): ReadinessCopy {
  return (level && READINESS_COPY[level]) || READINESS_COPY.NOT_READY;
}

export function getReadinessLabel(level?: string | null): string {
  if (!level) return '-';
  return readinessCopy(level).label;
}

export function getReadinessMessage(level?: string | null): string | null {
  if (!level) return null;
  return readinessCopy(level).message;
}

export function getReadinessClassName(
  level: string | null | undefined,
  pageCx: (className: string) => string,
): string {
  const key = (level && READINESS_CLASS[level]) || 'readinessNotReady';
  return pageCx(key);
}

export interface GaugeView {
  gaugePercentage: number;
  displayValue: string;
  gaugeLabel: string;
  gaugeTitle: string;
  gaugeMessage: string | null;
  gaugeLevel: string | null;
}

export function buildGaugeView(
  enhanced: Pick<
    EnhancedResultResponse,
    | 'examCategoryCode'
    | 'percentage'
    | 'hasTarget'
    | 'targetScore'
    | 'totalScore'
    | 'readinessScore'
    | 'readinessLevel'
  >,
  options?: { isBeginner?: boolean },
): GaugeView {
  const {
    examCategoryCode, percentage, hasTarget, targetScore,
    totalScore, readinessScore, readinessLevel,
  } = enhanced;

  if (examCategoryCode === 'QUICK_CHALLENGE') {
    const pct = percentage ?? 0;
    if (options?.isBeginner) {
      return {
        gaugePercentage: pct,
        displayValue: `${pct}%`,
        gaugeLabel: 'Điểm xuất phát',
        gaugeTitle: 'Mốc bắt đầu của bạn',
        gaugeMessage: 'Bạn chưa học kỳ này nên điểm thấp là bình thường. Con số này dùng để '
          + 'xếp bước bắt đầu, không phải kết quả thi.',
        gaugeLevel: 'STARTING',
      };
    }
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

export function buildRecoveryMessage({
  hasTarget,
  isTargetMet,
  readinessScore,
  readinessLevel,
}: {
  hasTarget?: boolean;
  isTargetMet?: boolean | null;
  readinessScore?: number | null;
  readinessLevel?: string | null;
}): string | null {
  if (hasTarget && isTargetMet !== true) {
    return 'Bạn chưa đạt điểm mục tiêu. '
      + 'Hãy lập lộ trình học để luyện đúng những phần thi còn yếu.';
  }
  if (!hasTarget && readinessLevel !== 'READY') {
    const score = readinessScore ?? 0;
    const next = Math.min(score + NEXT_READINESS_STEP, 100);
    return `Bước tiếp theo: nâng mức sẵn sàng từ ${score}% lên ${next}%. `
      + 'Hãy đặt điểm mục tiêu để WinDe lập lộ trình học phù hợp với bạn.';
  }
  return null;
}
