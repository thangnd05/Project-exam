import { useNavigate } from 'react-router-dom';

const COLOR_MAP = {
  // Quick Challenge levels
  EXCELLENT:  { color: '#22c55e', bg: '#f0fdf4' },
  GOOD:       { color: '#3b82f6', bg: '#eff6ff' },
  FAIR:       { color: '#f59e0b', bg: '#fffbeb' },
  WEAK:       { color: '#ef4444', bg: '#fef2f2' },
  // Readiness levels
  READY:             { color: '#22c55e', bg: '#f0fdf4' },
  ALMOST_READY:      { color: '#3b82f6', bg: '#eff6ff' },
  NEEDS_IMPROVEMENT: { color: '#f59e0b', bg: '#fffbeb' },
  NOT_READY:         { color: '#ef4444', bg: '#fef2f2' },
};

const getColorFromPercentage = (pct) => {
  if (pct >= 85) return COLOR_MAP.EXCELLENT;
  if (pct >= 60) return COLOR_MAP.GOOD;
  if (pct >= 30) return COLOR_MAP.FAIR;
  return COLOR_MAP.WEAK;
};

function ReadinessGauge({ enhanced }) {
  const navigate = useNavigate();
  const {
    examCategoryCode, examTypeId,
    gaugePercentage, displayValue, gaugeLabel, gaugeTitle, gaugeMessage,
    readinessLevel, hasTarget, passed, correct, total,
  } = enhanced;

  const isQuickChallenge = examCategoryCode === 'QUICK_CHALLENGE';

  // FE chỉ quyết màu sắc dựa trên data từ BE
  const { color, bg } = isQuickChallenge
    ? getColorFromPercentage(gaugePercentage)
    : (COLOR_MAP[readinessLevel] || COLOR_MAP.NOT_READY);

  // Target mode override color
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
    <div style={{
      padding: 20, borderRadius: 16, background: effectiveBg,
      border: `2px solid ${effectiveColor}`, textAlign: 'center', marginTop: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
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

        <div style={{ textAlign: 'left' }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: effectiveColor, marginBottom: 4 }}>
            {gaugeTitle}
          </h3>
          <p style={{ fontSize: 14, color: '#475569', maxWidth: 280, marginBottom: 8 }}>
            {gaugeMessage}
          </p>
          {isQuickChallenge && (
            <p style={{ fontSize: 14, color: '#475569' }}>
              Trả lời đúng <strong>{correct}/{total}</strong> câu
            </p>
          )}
          {!isQuickChallenge && passed != null && !hasTarget && (
            <span style={{
              display: 'inline-block', padding: '4px 12px', borderRadius: 20,
              fontSize: 13, fontWeight: 700,
              background: passed ? '#dcfce7' : '#fef2f2',
              color: passed ? '#16a34a' : '#dc2626',
            }}>
              {passed ? 'PASS (giả lập)' : '❌ FAIL (giả lập)'}
            </span>
          )}
        </div>
      </div>

      {isQuickChallenge && examTypeId && (
        <div
          onClick={() => navigate(`/exam-types/${examTypeId}`)}
          style={{
            marginTop: 16, padding: '12px 20px', background: '#3b82f6',
            color: '#fff', borderRadius: 10, fontWeight: 600, cursor: 'pointer',
            display: 'inline-block', fontSize: 15,
          }}
        >
          Làm Full Mock Exam để biết khả năng của bản thân →
        </div>
      )}
    </div>
  );
}

export default ReadinessGauge;
