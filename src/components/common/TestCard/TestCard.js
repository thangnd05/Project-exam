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

const DEFAULT_BANNERS = {
    open: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1200&auto=format&fit=crop',
    locked: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1200&auto=format&fit=crop',
    expired: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop',
};

const getSubjectBanner = (title = '', status = 'open') => {
    const normalizedTitle = String(title).toLowerCase();

    if (normalizedTitle.includes('toán') || normalizedTitle.includes('math')) {
        return 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1200&auto=format&fit=crop';
    }

    if (
        normalizedTitle.includes('hóa') ||
        normalizedTitle.includes('chem') ||
        normalizedTitle.includes('hoá')
    ) {
        return 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?q=80&w=1200&auto=format&fit=crop';
    }

    if (
        normalizedTitle.includes('lý') ||
        normalizedTitle.includes('vật lý') ||
        normalizedTitle.includes('physics')
    ) {
        return 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?q=80&w=1200&auto=format&fit=crop';
    }

    if (
        normalizedTitle.includes('anh') ||
        normalizedTitle.includes('english') ||
        normalizedTitle.includes('ielts')
    ) {
        return 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1200&auto=format&fit=crop';
    }

    return DEFAULT_BANNERS[status] || DEFAULT_BANNERS.open;
};

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
                        getSubjectBanner(test.title, status)
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
                            Thời lượng:{' '}
                            <strong>
                                {test.durationMinutes != null
                                    ? `${test.durationMinutes} phút`
                                    : 'Không giới hạn'}
                            </strong>
                        </span>
                    </div>

                    <div className={cx('info-item')}>
                        <IoCalendarOutline />
                        <span>Ngày mở: <strong>{formatDateTime(test.availableFrom)}</strong></span>
                    </div>

                    <div className={cx('info-item')}>
                        <IoHourglassOutline />
                        <span>Hạn nộp: <strong>{formatDateTime(test.availableTo)}</strong></span>
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
                        Lịch sử điểm
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TestCard;
