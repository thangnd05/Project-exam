'use client';

import { Spinner, Button } from 'react-bootstrap';
import classNames from 'classnames/bind';
import {
  IoLockClosedOutline,
  IoAlertCircleOutline,
  IoPlayCircleOutline,
  IoListOutline,
  IoTimeOutline,
  IoSaveOutline,
  IoCheckmarkDoneOutline,
} from 'react-icons/io5';
import styles from '@/app/components/exam-layout/TestStart.module.scss';

const cx = classNames.bind(styles);

type TestStateScreensProps = {
  status: string;
  test: { title?: string; durationMinutes?: number | null; costCoins?: number | null };
  balance: number;
  purchasing: boolean;
  preCountdown: number | null;
  formatTime: (seconds: number | null) => string;
  onBack: () => void;
  onPurchase: () => void;
  onRetry?: () => void;
  questionCount?: number;
  partCount?: number;
  onStart?: () => void;
};

export default function TestStateScreens({
  status,
  test,
  balance,
  purchasing,
  preCountdown,
  formatTime,
  onBack,
  onPurchase,
  onRetry,
  questionCount = 0,
  partCount = 0,
  onStart,
}: TestStateScreensProps) {
  if (status === 'loading')
    return (
      <div className={cx('state-box')}>
        <Spinner animation="grow" variant="primary" />
        <h3>Đang tải đề thi...</h3>
      </div>
    );

  if (status === 'ready') {
    const timed = (test.durationMinutes ?? 0) > 0;
    return (
      <div className={cx('state-box')}>
        <IoPlayCircleOutline size={80} color="var(--primary)" />
        <h3>{test.title || 'Sẵn sàng làm bài'}</h3>
        <ul className={cx('ready-facts')}>
          <li>
            <IoListOutline />
            <span><strong>{questionCount}</strong> câu hỏi{partCount > 1 ? `, chia thành ${partCount} phần` : ''}</span>
          </li>
          <li>
            <IoTimeOutline />
            <span>
              {timed ? (
                <>Thời gian: <strong>{test.durationMinutes} phút</strong>, tính từ lúc bấm bắt đầu</>
              ) : (
                <>Không giới hạn thời gian</>
              )}
            </span>
          </li>
          <li>
            <IoSaveOutline />
            <span>Câu trả lời được lưu tự động, lỡ tải lại trang vẫn làm tiếp được.</span>
          </li>
          <li>
            <IoCheckmarkDoneOutline />
            <span>
              Làm xong bấm <strong>Nộp bài</strong> để xem điểm và đáp án.
              {timed && ' Hết giờ bài sẽ tự nộp.'}
            </span>
          </li>
        </ul>
        <div className={cx('state-actions')}>
          <button
            type="button"
            className={cx('state-btn', 'state-btn-secondary')}
            onClick={onBack}
          >
            Quay lại
          </button>
          <button
            type="button"
            className={cx('state-btn', 'state-btn-primary')}
            onClick={onStart}
          >
            Bắt đầu làm bài
          </button>
        </div>
      </div>
    );
  }

  if (status === 'payment') {
    const cost = test.costCoins || 0;
    const enough = balance >= cost;
    return (
      <div className={cx('state-box')}>
        <IoLockClosedOutline size={80} color="var(--warning)" />
        <h3>Bài kiểm tra trả phí</h3>
        <p>
           Đầu tư một lần, sử dụng mãi mãi.
        </p>
        <div className={cx('state-actions')}>
          <button
            type="button"
            className={cx('state-btn', 'state-btn-secondary')}
            onClick={onBack}
          >
            Quay lại
          </button>
          <button
            type="button"
            className={cx('state-btn', 'state-btn-primary')}
            disabled={purchasing || !enough}
            onClick={onPurchase}
          >
            {purchasing ? 'Đang mở khoá...' : enough ? `Mở khoá (${cost} xu)` : 'Không đủ xu'}
          </button>
        </div>
      </div>
    );
  }

  if (status === 'no-attempts')
    return (
      <div className={cx('state-box')}>
        <IoAlertCircleOutline size={80} color="var(--danger-text)" />
        <h3>Hết lượt làm bài</h3>
        <p>Bạn đã hoàn thành số lượt làm bài cho phép cho bài thi này.</p>
        <Button
          variant="primary"
          className="mt-4 rounded-pill"
          onClick={onBack}
        >
          Quay lại
        </Button>
      </div>
    );

  if (status === 'locked')
    return (
      <div className={cx('state-box')}>
        <IoLockClosedOutline size={80} color="var(--text-secondary)" />
        <h3>Phòng thi chưa mở</h3>
        <p>Vui lòng đợi trong giây lát...</p>
        <div className={cx('timer-box', 'mt-4')}>
          <span className={cx('time')}>{formatTime(preCountdown)}</span>
        </div>
      </div>
    );

  if (status === 'closed')
    return (
      <div className={cx('state-box')}>
        <IoAlertCircleOutline size={80} color="var(--danger-text)" />
        <h3>Phòng thi đã đóng</h3>
        <p>Rất tiếc, thời gian tham gia bài thi này đã kết thúc.</p>
        <Button
          variant="secondary"
          className="mt-4 rounded-pill"
          onClick={onBack}
        >
          Quay lại
        </Button>
      </div>
    );

  if (status === 'error')
    return (
      <div className={cx('state-box')}>
        <IoAlertCircleOutline size={80} color="var(--danger-text)" />
        <h3>Không tải được đề thi</h3>
        <p>Có thể mạng đang chập chờn. Bạn thử tải lại, bài đã làm (nếu có) vẫn được giữ.</p>
        <div className={cx('state-actions')}>
          <button
            type="button"
            className={cx('state-btn', 'state-btn-secondary')}
            onClick={onBack}
          >
            Quay lại
          </button>
          {onRetry && (
            <button
              type="button"
              className={cx('state-btn', 'state-btn-primary')}
              onClick={onRetry}
            >
              Thử lại
            </button>
          )}
        </div>
      </div>
    );

  return null;
}
