import { useNavigate } from 'react-router-dom';
import {
    IoTimeOutline,
    IoCalendarOutline,
    IoHourglassOutline,
    IoStatsChartOutline,
    IoPlayCircleOutline,
    IoLockClosedOutline,
} from 'react-icons/io5';
import classNames from 'classnames/bind';
import styles from './TestCard.module.scss';
import {
    getTestStatus,
    calculateAllowedTime,
    formatDateTime,
} from '~/utils/testStatusHelper';

const cx = classNames.bind(styles);

function TestCard({ test, countdowns }) {
    const navigate = useNavigate();
    const now = new Date();

    const { status, statusLabel, buttonText, canStart } =
        getTestStatus(test, now, countdowns);

    const handleStart = () => {
        if (!canStart) return;

        const allowedTime = calculateAllowedTime(test);

        navigate(`/tests/${test.testId}/start`, {
            state: { allowedTime },
        });
    };

    return (
        <div className={cx('test-card')}>
            <div className={cx('banner-wrapper')}>
                <img
                    src={
                        test.bannerUrl ||
                        'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=1000&auto=format&fit=crop'
                    }
                    className={cx('banner-img')}
                    alt={test.title}
                />

                <div className={cx('status-badge', `status-${status}`)}>
                    {statusLabel}
                </div>
            </div>

            <div className={cx('card-body')}>
                <h5 className={cx('title')}>
                    {test.title || 'Bài tập luyện tập'}
                </h5>

                <div className={cx('info-list')}>
                    <div className={cx('info-item')}>
                        <IoTimeOutline />
                        <span>
                            Thời lượng: <strong>{test.durationMinutes || 0} phút</strong>
                        </span>
                    </div>

                    <div className={cx('info-item')}>
                        <IoCalendarOutline />
                        <span>Mở: {formatDateTime(test.availableFrom)}</span>
                    </div>

                    <div className={cx('info-item')}>
                        <IoHourglassOutline />
                        <span>Hạn: {formatDateTime(test.availableTo)}</span>
                    </div>
                </div>

                <div className={cx('btn-group')}>
                    <button
                        className={cx('btn-primary-modern')}
                        onClick={handleStart}
                        disabled={!canStart}
                    >
                        {canStart ? (
                            <IoPlayCircleOutline size={22} />
                        ) : (
                            <IoLockClosedOutline size={20} />
                        )}
                        {buttonText}
                    </button>

                    <button
                        className={cx('btn-outline-modern')}
                        onClick={() =>
                            navigate(`/tests/history/${test.testId}`)
                        }
                    >
                        <IoStatsChartOutline />
                        Lịch sử điểm của tôi
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TestCard;
