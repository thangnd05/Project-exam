'use client';

import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import styles from '@/app/features/tests/CreateTestModal.module.scss';
import { CREATOR_TYPES } from '@/app/features/tests/creator/hooks/useCreateTest';
import type { CreatorType } from '@/app/features/tests/creator/hooks/useCreateTest';

const cx = classNames.bind(styles);

type CreatorTabsProps = {
    activeCreatorType: CreatorType;
    setCreatorType: (creatorType: CreatorType) => void;
};

const CreatorTabs = ({ activeCreatorType, setCreatorType }: CreatorTabsProps) => {
    const t = useTranslations('TestCreator');
    return (
        <div className={cx('creatorTypeTabs')}>
            <button
                type="button"
                className={cx('creatorTypeTab', { active: activeCreatorType === CREATOR_TYPES.TEST })}
                onClick={() => setCreatorType(CREATOR_TYPES.TEST)}
            >
                {t('creatorTabs.test')}
            </button>
            <button
                type="button"
                className={cx('creatorTypeTab', { active: activeCreatorType === CREATOR_TYPES.BANK })}
                onClick={() => setCreatorType(CREATOR_TYPES.BANK)}
            >
                {t('creatorTabs.bank')}
            </button>
            <button
                type="button"
                className={cx('creatorTypeTab', { active: activeCreatorType === CREATOR_TYPES.BULK })}
                onClick={() => setCreatorType(CREATOR_TYPES.BULK)}
            >
                {t('creatorTabs.bulk')}
            </button>
            <button
                type="button"
                className={cx('creatorTypeTab', { active: activeCreatorType === CREATOR_TYPES.PASSAGE })}
                onClick={() => setCreatorType(CREATOR_TYPES.PASSAGE)}
            >
                {t('creatorTabs.passage')}
            </button>
        </div>
    );
};

export default CreatorTabs;
