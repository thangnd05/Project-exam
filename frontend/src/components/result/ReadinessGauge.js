import { useNavigate } from 'react-router-dom';

const LEVEL_CONFIG = {
  NOT_READY: { color: '#ef4444', bg: '#fef2f2', label: 'Chưa nên thi', message: 'Bạn cần củng cố nền tảng trước khi làm mock tiếp.' },
  NEEDS_IMPROVEMENT: { color: '#f59e0b', bg: '#fffbeb', label: 'Cần cải thiện', message: 'Bạn gần đạt nhưng còn lĩnh vực yếu có thể kéo tụt điểm.' },
  ALMOST_READY: { color: '#3b82f6', bg: '#eff6ff', label: 'Gần sẵn sàng', message: 'Tập trung sửa lỗi sai và làm final check.' },
  READY: { color: '#22c55e', bg: '#f0fdf4', label: 'Sẵn sàng cao', message: 'Bạn có thể cân nhắc đăng ký thi nếu duy trì kết quả ổn định.' },
};

const getQuickChallengeColor = (percentage) => {
  if (percentage >= 80) return { color: '#22c55e', bg: '#f0fdf4' };
  if (percentage >= 50) return { color: '#f59e0b', bg: '#fffbeb' };
  return { color: '#ef4444', bg: '#fef2f2' };
};


function ReadinessGauge({ readinessScore, readinessLevel, passed, examCategoryCode, hasTarget, targetScore, totalScore, correct, total, examTypeId }) {
  const navigate = useNavigate();
  const isQuickChallenge = examCategoryCode === 'QUICK_CHALLENGE';

  if (isQuickChallenge) {
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    const { color, bg } = getQuickChallengeColor(percentage);

    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const progress = (percentage / 100) * circumference;

    return (
      <div style={{
        padding: 20, borderRadius: 16, background: bg,
        border: `2px solid ${color}`, textAlign: 'center', marginTop: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
          <svg width="130" height="130" viewBox="0 0 130 130">
            <circle cx="65" cy="65" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
            <circle
              cx="65" cy="65" r={radius} fill="none"
              stroke={color} strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              strokeLinecap="round"
              transform="rotate(-90 65 65)"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
            <text x="65" y="60" textAnchor="middle" fontSize="28" fontWeight="800" fill={color}>
              {percentage}%
            </text>
            <text x="65" y="80" textAnchor="middle" fontSize="11" fill="#64748b">
              Độ chính xác
            </text>
          </svg>

          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: 14, color: '#475569', marginBottom: 8 }}>
              Trả lời đúng <strong>{correct}/{total}</strong> câu
            </p>
          </div>
        </div>

        {examTypeId && (
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

  // Circular gauge config
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  let cfg = LEVEL_CONFIG[readinessLevel] || LEVEL_CONFIG.NOT_READY;
  let displayValue = `${readinessScore}%`;
  let displayLabel = "Readiness";
  let gaugePercentage = readinessScore;
  let customTitle = cfg.label;
  let customMessage = cfg.message;

  if (hasTarget && targetScore) {
    const isTargetMet = totalScore >= targetScore;
    gaugePercentage = Math.min(100, Math.round((totalScore / targetScore) * 100));
    displayValue = `${totalScore}/${targetScore}`;
    displayLabel = "Mục tiêu";

    if (isTargetMet) {
      cfg = LEVEL_CONFIG.READY;
      customTitle = 'Đạt mục tiêu!';
      customMessage = `Chúc mừng! Bạn đã đạt mức điểm mục tiêu ${targetScore} đề ra.`;
    } else {
      cfg = LEVEL_CONFIG.NEEDS_IMPROVEMENT;
      customTitle = 'Chưa đạt mục tiêu';
      customMessage = `Bạn còn thiếu ${targetScore - totalScore} điểm nữa để đạt mục tiêu.`;
    }
  }

  const progress = (gaugePercentage / 100) * circumference;

  return (
    <div style={{
      padding: 20, borderRadius: 16, background: cfg.bg,
      border: `2px solid ${cfg.color}`, textAlign: 'center', marginTop: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
        {/* Circular gauge */}
        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle cx="65" cy="65" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
          <circle
            cx="65" cy="65" r={radius} fill="none"
            stroke={cfg.color} strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            transform="rotate(-90 65 65)"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
          <text x="65" y="60" textAnchor="middle" fontSize={hasTarget ? "22" : "28"} fontWeight="800" fill={cfg.color}>
            {displayValue}
          </text>
          <text x="65" y="80" textAnchor="middle" fontSize="11" fill="#64748b">
            {displayLabel}
          </text>
        </svg>

        {/* Info */}
        <div style={{ textAlign: 'left' }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: cfg.color, marginBottom: 4 }}>
            {customTitle}
          </h3>
          <p style={{ fontSize: 14, color: '#475569', maxWidth: 280, marginBottom: 8 }}>
            {customMessage}
          </p>
          {passed != null && !hasTarget && (
            <span style={{
              display: 'inline-block', padding: '4px 12px', borderRadius: 20,
              fontSize: 13, fontWeight: 700,
              background: passed ? '#dcfce7' : '#fef2f2',
              color: passed ? '#16a34a' : '#dc2626',
            }}>
              {passed ? ' PASS (giả lập)' : '❌ FAIL (giả lập)'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReadinessGauge;
