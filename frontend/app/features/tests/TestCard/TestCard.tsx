'use client';

import { useRouter } from '@/app/i18n/navigation';
import { useTranslations } from 'next-intl';
import { formatDayMonthTime, formatDateTime } from '@/app/utils/format-date-time';
import { Clock, Calendar, Hourglass, Lock, LockOpen, SquarePen, User, LogIn } from 'lucide-react';
import classNames from 'classnames/bind';
import MediaImage from '@/app/components/MediaImage/MediaImage';
import { getFullMediaUrl } from '@/app/utils/mediaUrl';
import styles from '@/app/features/tests/TestCard/TestCard.module.scss';
import TestModeModal from '@/app/features/tests/TestModeModal/TestModeModal';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import { useTestStart } from '@/app/features/tests/TestCard/hooks/useTestStart';
import type { TestResponse } from '@/app/types';
import { buildTestPath } from '@/app/configs/Routes';

const cx = classNames.bind(styles);

const DEFAULT_BANNERS: Record<string, string> = {
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

// dd/MM HH:mm cho lịch mở/đóng đề, dd/MM/yyyy HH:mm:ss cho thời gian tạo (theo ngôn ngữ đang dùng).

type TestCardProps = {
    test: TestResponse;
    countdowns?: Record<string, number>;
};

function TestCard({ test, countdowns }: TestCardProps) {
    const router = useRouter();
    const t = useTranslations('Tests');
    const {
        status,
        statusLabel,
        buttonText,
        canStart,
        isAuthenticated,
        guestAllowed,
        needsLogin,
        showLeaderboard,
        handleStart,
        modeModal,
    } = useTestStart(test, countdowns);

    return (
        <div className={cx('test-card')}>
            <div className={cx('banner-wrapper')}>
                <MediaImage
                    cover
                    src={getFullMediaUrl(test.bannerUrl) || getSubjectBanner(test.title, status)}
                    className={cx('banner-img')}
                    alt={test.title ?? ''}
                    width={480}
                    height={220}
                    sizes="(max-width: 768px) 100vw, 360px"
                />

                <div className={cx('status-badge', `status-${status}`)}>
                    {statusLabel}
                </div>

                {(test.costCoins ?? 0) > 0 && (
                    <div className={cx('cost-badge', { owned: test.owned })}>
                        {test.owned ? (
                            <LockOpen size={14} />
                        ) : (
                            <Lock size={14} />
                        )}
                        {test.owned ? t('owned') : t('coins', { count: test.costCoins ?? 0 })}
                    </div>
                )}
            </div>

            <div className={cx('card-body')}>
                <h5 className={cx('title')}>
                    {test.title || t('card.fallbackTitle')}
                </h5>

                <div className={cx('info-list')}>
                    <div className={cx('info-item')}>
                        <Clock size="1em" />
                        <span>
                            {t('card.duration')}{' '}
                            <strong>
                                {test.durationMinutes != null
                                    ? t('minutes', { count: test.durationMinutes })
                                    : t('unlimited')}
                            </strong>
                        </span>
                    </div>

                    <div className={cx('info-item')}>
                        <Calendar size="1em" />
                        <span>{t('card.opensAt')} <strong>{formatDayMonthTime(test.availableFrom)}</strong></span>
                    </div>

                    <div className={cx('info-item')}>
                        <Hourglass size="1em" />
                        <span>{t('card.deadline')} <strong>{formatDayMonthTime(test.availableTo)}</strong></span>
                    </div>
                </div>

                {guestAllowed !== null && (
                    <div className={cx('access-line', guestAllowed ? 'access-guest' : 'access-login')}>
                        {guestAllowed ? <User size="1em" /> : <LogIn size="1em" />}
                        <span>
                            {guestAllowed
                                ? t('card.guestAllowed')
                                : t('card.loginRequired')}
                        </span>
                    </div>
                )}

                <div className={cx('info-item', 'created-line')}>
                    <SquarePen size="1em" />
                    <span>{t('card.createdAt')} <strong>{formatDateTime(test.createdAt)}</strong></span>
                </div>

                <div className={cx('btn-group', {hasRank: showLeaderboard, solo: !isAuthenticated})}>
                    <ButtonPrime
                        variant="primary"
                        size="sm"
                        className={cx('btn-primary-modern')}
                        onClick={handleStart}
                        disabled={!canStart}
                    >
                        {needsLogin && canStart ? t('loginToStart') : buttonText}
                    </ButtonPrime>

                    {isAuthenticated && (
                        <ButtonPrime
                            variant="outline"
                            size="sm"
                            className={cx('btn-outline-modern')}
                            onClick={() =>
                                router.push(buildTestPath(test, 'history'))
                            }
                        >
                            {t('history')}
                        </ButtonPrime>
                    )}

                    {showLeaderboard && (
                        <ButtonPrime
                            variant="ghost"
                            size="sm"
                            className={cx('btn-icon-modern')}
                            title={t('leaderboard')}
                            aria-label={t('leaderboard')}
                            onClick={() =>
                                router.push(buildTestPath(test, 'leaderboard'))
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
                        </ButtonPrime>
                    )}
                </div>
            </div>

            <TestModeModal
                show={modeModal.show}
                test={test}
                onClose={modeModal.onClose}
                onStart={modeModal.onStart}
            />
        </div>
    );
}

export default TestCard;
