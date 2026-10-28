'use client';

import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
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
            <ButtonPrime
                variant={activeCreatorType === CREATOR_TYPES.TEST ? 'primary' : 'soft'}
                onClick={() => setCreatorType(CREATOR_TYPES.TEST)}
            >
                {t('creatorTabs.test')}
            </ButtonPrime>
            <ButtonPrime
                variant={activeCreatorType === CREATOR_TYPES.BANK ? 'primary' : 'soft'}
                onClick={() => setCreatorType(CREATOR_TYPES.BANK)}
            >
                {t('creatorTabs.bank')}
            </ButtonPrime>
            <ButtonPrime
                variant={activeCreatorType === CREATOR_TYPES.BULK ? 'primary' : 'soft'}
                onClick={() => setCreatorType(CREATOR_TYPES.BULK)}
            >
                {t('creatorTabs.bulk')}
            </ButtonPrime>
            <ButtonPrime
                variant={activeCreatorType === CREATOR_TYPES.PASSAGE ? 'primary' : 'soft'}
                onClick={() => setCreatorType(CREATOR_TYPES.PASSAGE)}
            >
                {t('creatorTabs.passage')}
            </ButtonPrime>
        </div>
    );
};

export default CreatorTabs;
