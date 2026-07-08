import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IoTimeOutline,
    IoCalendarOutline,
    IoHourglassOutline,
    IoStatsChartOutline,
    IoPlayCircleOutline,
    IoLockClosedOutline,
    IoLockOpenOutline,
    IoCreateOutline,
} from 'react-icons/io5';
import classNames from 'classnames/bind';
import styles from './TestCard.module.scss';
import {
    getTestStatus,
    calculateAllowedTime,
    formatDateTime,
    formatFullDateTime,
} from '~/utils/testStatusHelper';
import TestModeModal from '~/components/test/TestModeModal/TestModeModal';

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
    const [showModeModal, setShowModeModal] = useState(false);

    const { status, statusLabel, buttonText, canStart } =
        getTestStatus(test, now, countdowns);

    const showLeaderboard =
        test.availableTo == null || now > new Date(test.availableTo);

    const handleStart = () => {
        if (!canStart) return;
        setShowModeModal(true);
    };

    const handleSelectMode = ({ mode, examPartIds }) => {
        setShowModeModal(false);
        const allowedTime = calculateAllowedTime(test);
        const params = new URLSearchParams();
        if (mode === 'practice') {
            params.set('mode', 'practice');
            if (examPartIds?.length) params.set('parts', examPartIds.join(','));
        }
        const qs = params.toString();
        navigate(`/tests/${test.testId}/start${qs ? `?${qs}` : ''}`, {
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

                {test.costCoins > 0 && (
                    <div className={cx('cost-badge', { owned: test.owned })}>
                        {test.owned ? (
                            <IoLockOpenOutline size={14} />
                        ) : (
                            <IoLockClosedOutline size={14} />
                        )}
                        {test.owned ? 'Đã mở khoá' : `${test.costCoins} xu`}
                    </div>
                )}
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

                <div className={cx('info-item', 'created-line')}>
                    <IoCreateOutline />
                    <span>Thời gian tạo: <strong>{formatFullDateTime(test.createdAt)}</strong></span>
                </div>

                <div className={cx('btn-group', {hasRank: showLeaderboard})}>
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
                        Lịch sử
                    </button>

                    {showLeaderboard && (
                        <button
                            className={cx('btn-icon-modern')}
                            title="Bảng xếp hạng"
                            aria-label="Bảng xếp hạng"
                            onClick={() =>
                                navigate(`/tests/leaderboard/${test.testId}`)
                            }
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                                focusable="false"
                            >
                                <path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978" />
                                <path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978" />
                                <path d="M18 9h1.5a1 1 0 0 0 0-5H18" />
                                <path d="M4 22h16" />
                                <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" />
                                <path d="M6 9H4.5a1 1 0 0 1 0-5H6" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            <TestModeModal
                show={showModeModal}
                test={test}
                onClose={() => setShowModeModal(false)}
                onStart={handleSelectMode}
            />
        </div>
    );
}

export default TestCard;
