import ReactDOM from 'react-dom';
import classNames from 'classnames/bind';
import { Trophy, X } from 'lucide-react';
import styles from './PlanCongratsModal.module.scss';

const cx = classNames.bind(styles);

export const congratsSeenKey = (learningPlanId) => `plan-congrats-seen-${learningPlanId}`;

export const markCongratsSeen = (learningPlanId) => {
  try {
    localStorage.setItem(congratsSeenKey(learningPlanId), '1');
  } catch { /* ignore */ }
};

const CONFETTI_COLORS = ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa', '#f87171'];
const CONFETTI_PIECES = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 100) / 18 + 2}%`,
  background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  animationDuration: `${2.4 + (i % 5) * 0.5}s`,
  animationDelay: `${(i % 7) * 0.35}s`,
}));

function PlanCongratsModal({ show, onClose, onNext, totalTasks, planSequence }) {
  if (!show) return null;

  return ReactDOM.createPortal(
    <div className={cx('overlay')} onClick={onClose} role="dialog" aria-modal="true">
      <div className={cx('card')} onClick={(e) => e.stopPropagation()}>
        <div className={cx('hero')}>
          {CONFETTI_PIECES.map((style, i) => (
            <span key={i} className={cx('confetti')} style={style} aria-hidden />
          ))}
          <button type="button" className={cx('closeBtn')} onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
          <div className={cx('trophyRing')}>
            <Trophy />
          </div>
          <h2 className={cx('heroTitle')}>Chúc mừng!</h2>
          <p className={cx('heroSub')}>
            Bạn đã vượt toàn bộ ải của lộ trình{planSequence != null ? ` #${planSequence}` : ''}
          </p>
        </div>

        <div className={cx('body')}>
          {totalTasks != null && (
            <span className={cx('progressPill')}>
              {totalTasks}/{totalTasks} ải hoàn thành
            </span>
          )}

          <ul className={cx('nextSteps')}>
            <li className={cx('nextStep')}>
              <span className={cx('stepNum')}>1</span>
              <span className={cx('stepText')}>
                Làm một bài <strong>thi thử trọn đề</strong> để chấm lại độ sẵn sàng thật của bạn.
              </span>
            </li>
            <li className={cx('nextStep')}>
              <span className={cx('stepNum')}>2</span>
              <span className={cx('stepText')}>
                Quay lại trang kế hoạch và <strong>sinh lộ trình mới từ chính bài đó</strong> —
                lặp đến khi đạt mục tiêu.
              </span>
            </li>
          </ul>

          <div className={cx('actions')}>
            <button type="button" className={cx('btnPrimary')} onClick={onNext}>
              Xem bước tiếp theo
            </button>
            <button type="button" className={cx('btnGhost')} onClick={onClose}>
              Để sau
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default PlanCongratsModal;
