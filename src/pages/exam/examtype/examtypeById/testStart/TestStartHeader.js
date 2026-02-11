import { Container } from 'react-bootstrap';
import {
  IoChevronBackOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
} from 'react-icons/io5';
import classNames from 'classnames/bind';
import styles from './TestStartPage.module.scss';

const cx = classNames.bind(styles);

function TestStartHeader({
  testTitle,
  testType,
  totalQuestions,
  completedCount,
  timeLeft,
  formatTime,
  onBack,
}) {
  const progressPercent =
    totalQuestions > 0 ? (completedCount / totalQuestions) * 100 : 0;

  return (
    <header className={cx('header')}>
      <Container>
        <div className={cx('header-inner')}>
          <div className={cx('header-left')}>
            <button
              type="button"
              className={cx('btn-back')}
              onClick={onBack}
              title="Quay lại"
              aria-label="Quay lại"
            >
              <IoChevronBackOutline />
            </button>
            <div className={cx('test-info')}>
              <div className={cx('title-wrapper')}>
                <span className={cx('title-prefix')}>Đề thi:</span>
                <h2>{testTitle}</h2>
              </div>
              <div className={cx('test-meta')}>
                <span>{testType || 'Kiểm tra'}</span>
                <span className={cx('separator')}>•</span>
                <span>{totalQuestions} câu hỏi</span>
              </div>
            </div>
          </div>

          <div className={cx('header-right')}>
            <div className={cx('stats-item', 'stats-timer')}>
              <div className={cx('stats-label')}>THỜI GIAN</div>
              <div className={cx('stats-value', 'stats-time-value')}>
                <IoTimeOutline className={cx('icon')} />
                <span>{formatTime(timeLeft)}</span>
              </div>
            </div>
            <div className={cx('stats-item')}>
              <div className={cx('stats-label')}>HOÀN THÀNH</div>
              <div className={cx('stats-value')}>
                <IoCheckmarkCircleOutline className={cx('icon')} />
                <span>{completedCount}/{totalQuestions}</span>
              </div>
            </div>
          </div>
        </div>
      </Container>

      <div className={cx('progress-container')}>
        <div
          className={cx('progress-bar')}
          style={{ width: `${progressPercent}%` }}
          role="progressbar"
          aria-valuenow={completedCount}
          aria-valuemin={0}
          aria-valuemax={totalQuestions}
        />
      </div>
    </header>
  );
}

export default TestStartHeader;
