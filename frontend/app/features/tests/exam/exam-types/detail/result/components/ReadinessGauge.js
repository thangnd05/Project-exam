'use client';

import { useRouter } from 'next/navigation';
import classNames from 'classnames/bind';
import InfoTip from '@/app/components/InfoTip/InfoTip';
import { TERM_TIPS } from '@/app/features/diagnostic/termTips';
import { buildGaugeView } from '@/app/features/diagnostic/target/utils/readiness-label';
import styles from './Result.module.scss';
import { brandColors } from '@/app/assets/styles/brandColors';

const cx = classNames.bind(styles);

const COLOR_MAP = {

  EXCELLENT:  { color: '#16a34a', bg: '#f0fdf4' },
  GOOD:       { color: brandColors.primary, bg: brandColors.brand50 },
  FAIR:       { color: brandColors.unique, bg: '#fffbeb' },
  WEAK:       { color: '#ef4444', bg: '#fef2f2' },

  READY:             { color: '#16a34a', bg: '#f0fdf4' },
  ALMOST_READY:      { color: brandColors.primary, bg: brandColors.brand50 },
  NEEDS_IMPROVEMENT: { color: brandColors.unique, bg: '#fffbeb' },
  NOT_READY:         { color: '#ef4444', bg: '#fef2f2' },
};

function ReadinessGauge({ enhanced }) {
  const router = useRouter();
  const { examCategoryCode, examTypeId, readinessLevel, hasTarget, correct, total } = enhanced;

  const { gaugePercentage, displayValue, gaugeLabel, gaugeTitle, gaugeMessage, gaugeLevel } =
    buildGaugeView(enhanced);

  const isQuickChallenge = examCategoryCode === 'QUICK_CHALLENGE';

  const { color, bg } = isQuickChallenge
    ? (COLOR_MAP[gaugeLevel] || COLOR_MAP.WEAK)
    : (COLOR_MAP[readinessLevel] || COLOR_MAP.NOT_READY);

  const effectiveColor = (!isQuickChallenge && hasTarget)
    ? (enhanced.isTargetMet ? COLOR_MAP.READY.color : COLOR_MAP.NEEDS_IMPROVEMENT.color)
    : color;
  const effectiveBg = (!isQuickChallenge && hasTarget)
    ? (enhanced.isTargetMet ? COLOR_MAP.READY.bg : COLOR_MAP.NEEDS_IMPROVEMENT.bg)
    : bg;

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (gaugePercentage / 100) * circumference;

  return (
    <div className={cx('gaugeContainer')} style={{ background: effectiveBg, borderColor: effectiveColor, borderWidth: 1, borderStyle: 'solid' }}>
      <div className={cx('gaugeFlex')}>
        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle cx="65" cy="65" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
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
          <text x="65" y="80" textAnchor="middle" fontSize="11" fill="#64748b">
            {gaugeLabel}
          </text>
        </svg>

        <div className={cx('gaugeInfo')}>
          <h3 className={cx('gaugeTitle')} style={{ color: effectiveColor }}>
            {gaugeTitle}
            {!isQuickChallenge && !hasTarget && <InfoTip text={TERM_TIPS.readiness} />}
          </h3>
          {gaugeMessage && (
            <p className={cx('gaugeMessage')}>
              {gaugeMessage}
            </p>
          )}
          {isQuickChallenge && (
            <p className={cx('gaugeStat')}>
              Trả lời đúng <strong>{correct}/{total}</strong> câu
            </p>
          )}
        </div>
      </div>

      {isQuickChallenge && examTypeId && (
        <div
          className={cx('actionButton')}
          style={{ backgroundColor: effectiveColor }}
          onClick={() => router.push(`/exam-types/${examTypeId}`)}
        >
          Làm Full Mock Exam để biết khả năng của bản thân
        </div>
      )}
    </div>
  );
}

export default ReadinessGauge;
