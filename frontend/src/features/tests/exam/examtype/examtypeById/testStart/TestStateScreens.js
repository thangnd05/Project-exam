import { Spinner, Button } from 'react-bootstrap';
import classNames from 'classnames/bind';
import {
  IoLockClosedOutline,
  IoAlertCircleOutline,
} from 'react-icons/io5';
import styles from './TestStartPage.module.scss';

const cx = classNames.bind(styles);

export default function TestStateScreens({
  status,
  test,
  balance,
  purchasing,
  preCountdown,
  formatTime,
  onBack,
  onPurchase,
}) {
  if (status === 'loading')
    return (
      <div className={cx('state-box')}>
        <Spinner animation="grow" variant="primary" />
        <h3>Đang niêm phong đề thi...</h3>
      </div>
    );

  if (status === 'payment') {
    const cost = test.costCoins || 0;
    const enough = balance >= cost;
    return (
      <div className={cx('state-box')}>
        <IoLockClosedOutline size={80} color="#f08c00" />
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
        <IoAlertCircleOutline size={80} color="#ef4444" />
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
        <IoLockClosedOutline size={80} color="#64748b" />
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
        <IoAlertCircleOutline size={80} color="#ef4444" />
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

  return null;
}
