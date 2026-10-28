'use client';

import { useRouter } from '@/app/i18n/navigation';
import { buildExamTypeDetailPath } from '@/app/configs/Routes';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import { useMounted } from '@/app/hooks/useMounted';
import InfoTip from '@/app/components/InfoTip/InfoTip';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import { isBeginnerLevel } from '@/app/features/learning-plans/learnerLevel';
import { buildGaugeView } from '@/app/features/my-target/readiness-label';
import styles from './Result.module.scss';
import { brandColors } from '@/app/assets/styles/brandColors';
import type { EnhancedResultResponse } from '@/app/types';

const cx = classNames.bind(styles);

type GaugeColor = { color: string; bg: string };

const COLOR_MAP: Record<string, GaugeColor> = {

  EXCELLENT:  { color: 'var(--green-600)', bg: 'var(--green-50)' },
  GOOD:       { color: brandColors.primary, bg: brandColors.brand50 },
  FAIR:       { color: brandColors.unique, bg: 'var(--amber-50)' },
  WEAK:       { color: 'var(--red-500)', bg: 'var(--red-50)' },

  READY:             { color: 'var(--green-600)', bg: 'var(--green-50)' },
  ALMOST_READY:      { color: brandColors.primary, bg: brandColors.brand50 },
  NEEDS_IMPROVEMENT: { color: brandColors.unique, bg: 'var(--amber-50)' },
  NOT_READY:         { color: 'var(--red-500)', bg: 'var(--red-50)' },

  STARTING:   { color: brandColors.primary, bg: brandColors.brand50 },
};

type ReadinessGaugeProps = {
  enhanced: EnhancedResultResponse;
  isPractice?: boolean;
};

function ReadinessGauge({ enhanced, isPractice = false }: ReadinessGaugeProps) {
  const router = useRouter();
  const t = useTranslations('TestTaking.readinessGauge');
  // readiness-label dịch theo namespace MyTarget; truyền translator để nhãn theo ngôn ngữ đang xem.
  const tTarget = useTranslations('MyTarget');
  const tPlans = useTranslations('LearningPlans');
  const { examCategoryCode, examTypeId, readinessLevel, hasTarget } = enhanced;

  const isQuickChallenge = examCategoryCode === 'QUICK_CHALLENGE';

  // Trình độ tự khai nằm ở localStorage: chỉ đọc sau khi mount để không lệch hydration.
  const mounted = useMounted();
  const isBeginner = mounted && isQuickChallenge && isBeginnerLevel(examTypeId);

  const { gaugePercentage, displayValue, gaugeLabel, gaugeTitle, gaugeMessage, gaugeLevel } =
    buildGaugeView(enhanced, { isBeginner, isPractice, t: tTarget });

  const { color, bg } = isQuickChallenge
    ? ((gaugeLevel && COLOR_MAP[gaugeLevel]) || COLOR_MAP.WEAK)
    : ((readinessLevel && COLOR_MAP[readinessLevel]) || COLOR_MAP.NOT_READY);

  const effectiveColor = (!isQuickChallenge && !isPractice && hasTarget)
    ? (enhanced.isTargetMet ? COLOR_MAP.READY.color : COLOR_MAP.NEEDS_IMPROVEMENT.color)
    : color;
  const effectiveBg = (!isQuickChallenge && !isPractice && hasTarget)
    ? (enhanced.isTargetMet ? COLOR_MAP.READY.bg : COLOR_MAP.NEEDS_IMPROVEMENT.bg)
    : bg;

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (gaugePercentage / 100) * circumference;

  return (
    <div className={cx('gaugeContainer')} style={{ background: effectiveBg, borderColor: effectiveColor, borderWidth: 1, borderStyle: 'solid' }}>
      <div className={cx('gaugeFlex')}>
        {/* Bài thử nhanh: độ chính xác và số câu đúng đã có ở thẻ kết quả bên cạnh, chỉ giữ nhận xét. */}
        {!isQuickChallenge && (
          <svg width="130" height="130" viewBox="0 0 130 130">
            <circle cx="65" cy="65" r={radius} fill="none" stroke="var(--slate-200)" strokeWidth="10" />
            <circle
              cx="65" cy="65" r={radius} fill="none"
              stroke={effectiveColor} strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              strokeLinecap="round"
              transform="rotate(-90 65 65)"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
            <text x="65" y="60" textAnchor="middle" fontSize={hasTarget ? "22" : "28"} fontWeight="800" fill={effectiveColor}>
              {displayValue}
            </text>
            <text x="65" y="80" textAnchor="middle" fontSize="11" fill="var(--slate-500)">
              {gaugeLabel}
            </text>
          </svg>
        )}

        <div className={cx('gaugeInfo', { centered: isQuickChallenge })}>
          <h3 className={cx('gaugeTitle')} style={{ color: effectiveColor }}>
            {gaugeTitle}
            {!isQuickChallenge && !hasTarget && <InfoTip text={tPlans('termTips.readiness')} />}
          </h3>
          {gaugeMessage && (
            <p className={cx('gaugeMessage')}>
              {gaugeMessage}
            </p>
          )}
        </div>
      </div>

      {isQuickChallenge && examTypeId && (
        // Nền/viền/chữ inline để thắng màu brand của variant: nút mang màu của mức sẵn sàng.
        <ButtonPrime
          variant="primary"
          size="md"
          className={cx('actionButton')}
          style={{ background: effectiveColor, borderColor: effectiveColor, color: 'var(--white)' }}
          onClick={() => router.push(buildExamTypeDetailPath(examTypeId))}
        >
          {isBeginner ? t('beginnerCta') : t('fullTestCta')}
        </ButtonPrime>
      )}
    </div>
  );
}

export default ReadinessGauge;
