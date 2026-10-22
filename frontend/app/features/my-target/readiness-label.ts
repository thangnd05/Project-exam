import { createTranslator, type useTranslations } from 'next-intl';
import type { EnhancedResultResponse, PartBreakdownResponse } from '@/app/types';
import viMyTarget from '@/app/i18n/messages/vi/MyTarget.json';

export type MyTargetTranslator = ReturnType<typeof useTranslations<'MyTarget'>>;

type ReadinessLevelKey = 'READY' | 'ALMOST_READY' | 'NEEDS_IMPROVEMENT' | 'NOT_READY';
type QuickTierLevel = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'WEAK';

const READINESS_LEVELS: readonly ReadinessLevelKey[] = [
  'READY',
  'ALMOST_READY',
  'NEEDS_IMPROVEMENT',
  'NOT_READY',
];

const READINESS_CLASS: Record<string, string> = {
  READY: 'readinessReady',
  ALMOST_READY: 'readinessAlmost',
  NEEDS_IMPROVEMENT: 'readinessNeeds',
  NOT_READY: 'readinessNotReady',
};

const QUICK_CHALLENGE_TIERS: { min: number; level: QuickTierLevel }[] = [
  { min: 85, level: 'EXCELLENT' },
  { min: 60, level: 'GOOD' },
  { min: 30, level: 'FAIR' },
  { min: 0, level: 'WEAK' },
];

const NEXT_READINESS_STEP = 10;

// Chỗ gọi không truyền t thì dùng bản tiếng Việt (giữ tương thích cho các trang gọi cũ).
let viTranslator: MyTargetTranslator | null = null;
function fallbackT(): MyTargetTranslator {
  if (!viTranslator) {
    viTranslator = createTranslator({
      locale: 'vi',
      messages: { MyTarget: viMyTarget },
      namespace: 'MyTarget',
    }) as unknown as MyTargetTranslator;
  }
  return viTranslator;
}

function readinessLevelKey(level?: string | null): ReadinessLevelKey {
  return READINESS_LEVELS.find((l) => l === level) ?? 'NOT_READY';
}

export function getReadinessLabel(level?: string | null, t: MyTargetTranslator = fallbackT()): string {
  if (!level) return '-';
  return t(`readiness.levels.${readinessLevelKey(level)}.label`);
}

export function getReadinessMessage(level?: string | null, t: MyTargetTranslator = fallbackT()): string | null {
  if (!level) return null;
  return t(`readiness.levels.${readinessLevelKey(level)}.message`);
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
  options?: { isBeginner?: boolean; isPractice?: boolean; t?: MyTargetTranslator },
): GaugeView {
  const {
    examCategoryCode, percentage, hasTarget, targetScore,
    totalScore, readinessScore, readinessLevel,
  } = enhanced;
  const t = options?.t ?? fallbackT();

  if (examCategoryCode === 'QUICK_CHALLENGE') {
    const pct = percentage ?? 0;
    if (options?.isBeginner) {
      return {
        gaugePercentage: pct,
        displayValue: `${pct}%`,
        gaugeLabel: t('readiness.gauge.startLabel'),
        gaugeTitle: t('readiness.gauge.startTitle'),
        gaugeMessage: t('readiness.gauge.startMessage'),
        gaugeLevel: 'STARTING',
      };
    }
    const tier = QUICK_CHALLENGE_TIERS.find((tr) => pct >= tr.min)
      ?? QUICK_CHALLENGE_TIERS[QUICK_CHALLENGE_TIERS.length - 1];
    return {
      gaugePercentage: pct,
      displayValue: `${pct}%`,
      gaugeLabel: t('readiness.gauge.accuracy'),
      gaugeTitle: t(`readiness.quickTiers.${tier.level}`),
      gaugeMessage: null,
      gaugeLevel: tier.level,
    };
  }

  // Bài luyện theo phần chỉ chấm vài Part nên không so với điểm mục tiêu cả đề.
  if (hasTarget && targetScore != null && !options?.isPractice) {
    const ts = totalScore ?? 0;
    const targetMet = ts >= targetScore;
    return {
      gaugePercentage: Math.min(100, Math.round((ts / targetScore) * 100)),
      displayValue: `${ts}/${targetScore}`,
      gaugeLabel: t('readiness.gauge.target'),
      gaugeTitle: targetMet ? t('readiness.gauge.targetMet') : t('readiness.gauge.targetNotMet'),
      gaugeMessage: targetMet
        ? t('readiness.gauge.targetMetMessage', { score: targetScore })
        : t('readiness.gauge.targetGapMessage', { gap: targetScore - ts }),
      gaugeLevel: null,
    };
  }

  const score = readinessScore ?? 0;
  const levelKey = readinessLevelKey(readinessLevel);
  return {
    gaugePercentage: score,
    displayValue: `${score}%`,
    gaugeLabel: t('readiness.gauge.readiness'),
    gaugeTitle: t(`readiness.levels.${levelKey}.label`),
    gaugeMessage: t(`readiness.levels.${levelKey}.message`),
    gaugeLevel: null,
  };
}

export function buildRecoveryMessage({
  hasTarget,
  isTargetMet,
  readinessScore,
  readinessLevel,
  t = fallbackT(),
}: {
  hasTarget?: boolean;
  isTargetMet?: boolean | null;
  readinessScore?: number | null;
  readinessLevel?: string | null;
  t?: MyTargetTranslator;
}): string | null {
  if (hasTarget && isTargetMet !== true) {
    return t('readiness.recovery.targetNotMet');
  }
  if (!hasTarget && readinessLevel !== 'READY') {
    const score = readinessScore ?? 0;
    const next = Math.min(score + NEXT_READINESS_STEP, 100);
    return t('readiness.recovery.nextStep', { score, next });
  }
  return null;
}

// Bài luyện theo phần: so từng Part đã luyện với mục tiêu % của chính Part đó.
export function buildPracticeRecoveryMessage(
  parts: Pick<PartBreakdownResponse, 'partName' | 'percentage' | 'targetPercentage' | 'isTargetMet'>[],
  t: MyTargetTranslator = fallbackT(),
): { message: string; allMet: boolean } | null {
  const withTarget = parts.filter((p) => p.targetPercentage != null);
  if (withTarget.length === 0) return null;
  const missed = withTarget.filter((p) => p.isTargetMet !== true);
  if (missed.length === 0) {
    return {
      message: t('readiness.recovery.practiceAllMet'),
      allMet: true,
    };
  }
  const detail = missed
    .map((p) => t('readiness.recovery.practicePart', {
      part: p.partName ?? '',
      pct: Math.round(p.percentage),
      target: Math.round(p.targetPercentage!),
    }))
    .join(', ');
  return {
    message: t('readiness.recovery.practiceMissed', { detail }),
    allMet: false,
  };
}
