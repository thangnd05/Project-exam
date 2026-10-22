'use client';

import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import classNames from 'classnames/bind';
import {useTranslations} from 'next-intl';

import {getMyQuests, QUESTS_QUERY_KEY} from '@/app/apis/questApi';
import {useAuth} from '@/app/hooks/useAuth';
import CoinBadge from '@/app/features/gamification/coin/CoinBadge';
import QuestModal from '@/app/features/gamification/coin/QuestModal';
import style from '@/app/features/gamification/coin/CoinQuestMenu.module.scss';

const cx = classNames.bind(style);

type CoinQuestMenuProps = {
  variant?: 'default' | 'onDark';
  className?: string;
};

function CoinQuestMenu({variant = 'default', className}: CoinQuestMenuProps) {
  const [open, setOpen] = useState(false);
  const {isAuthenticated} = useAuth();
  const t = useTranslations('Gamification.coins');

  // Có thưởng chưa nhận thì chấm báo trên nút xu, để người dùng biết mở nhiệm vụ ra.
  const {data: quests = []} = useQuery({
    queryKey: QUESTS_QUERY_KEY,
    queryFn: getMyQuests,
    enabled: isAuthenticated,
  });
  const claimableCount = quests.filter((quest) => quest.eligible).length;

  return (
    <>
      <button
        type="button"
        className={cx('trigger', className)}
        onClick={() => setOpen(true)}
        title={claimableCount > 0 ? t('menuTitleClaimable', {count: claimableCount}) : t('menuTitle')}
        aria-label={
          claimableCount > 0
            ? t('menuAriaClaimable', {count: claimableCount})
            : t('menuAria')
        }
      >
        <CoinBadge variant={variant} />
        {claimableCount > 0 && <span className={cx('dot')} aria-hidden />}
      </button>
      <QuestModal show={open} onClose={() => setOpen(false)} />
    </>
  );
}

export default CoinQuestMenu;
