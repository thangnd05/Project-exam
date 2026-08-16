'use client';

import classNames from 'classnames/bind';
import style from './CoinBadge.module.scss';
import { useCoins } from '@/app/hooks/useCoins';
import { formatCompactNumber, formatFullNumber } from '@/app/utils/formatNumber';
import { FaCircleDollarToSlot } from 'react-icons/fa6';

const cx = classNames.bind(style);

type CoinBadgeProps = {
  className?: string;
  variant?: 'default' | 'onDark';
};

function CoinBadge({ className, variant = 'default' }: CoinBadgeProps) {
  const { balance } = useCoins();
  const fullBalance = formatFullNumber(balance);

  return (
    <div
      className={cx('coinBadge', variant === 'onDark' && 'onDark', className)}
      title={`${fullBalance} xu  bấm để xem nhiệm vụ`}
    >
      <FaCircleDollarToSlot className={cx('icon')} />
      <span className={cx('count')}>{formatCompactNumber(balance)}</span>
    </div>
  );
}

export default CoinBadge;
