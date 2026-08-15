'use client';

import {useState} from 'react';
import classNames from 'classnames/bind';

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

  return (
    <>
      <button
        type="button"
        className={cx('trigger', className)}
        onClick={() => setOpen(true)}
        title="Xem nhiệm vụ"
        aria-label="Xem số dư xu và nhiệm vụ"
      >
        <CoinBadge variant={variant} />
      </button>
      <QuestModal show={open} onClose={() => setOpen(false)} />
    </>
  );
}

export default CoinQuestMenu;
