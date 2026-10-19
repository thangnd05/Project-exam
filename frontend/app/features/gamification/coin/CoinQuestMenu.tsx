'use client';

import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import classNames from 'classnames/bind';

import {getMyQuests, QUESTS_QUERY_KEY} from '@/app/apis/questApi';
import {useAuth} from '@/app/hooks/useAuth';
import CoinBadge from './CoinBadge';
import QuestModal from './QuestModal';
import style from './CoinQuestMenu.module.scss';

const cx = classNames.bind(style);

type CoinQuestMenuProps = {
  variant?: 'default' | 'onDark';
  className?: string;
};

function CoinQuestMenu({variant = 'default', className}: CoinQuestMenuProps) {
  const [open, setOpen] = useState(false);
  const {isAuthenticated} = useAuth();

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
        title={claimableCount > 0 ? `Có ${claimableCount} phần thưởng chưa nhận` : 'Xem nhiệm vụ'}
        aria-label={
          claimableCount > 0
            ? `Xem số dư xu và nhiệm vụ, có ${claimableCount} phần thưởng chưa nhận`
            : 'Xem số dư xu và nhiệm vụ'
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
