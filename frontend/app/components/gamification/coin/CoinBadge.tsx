'use client';

import { FontAwesomeIcon as FontAwesomeIconBase } from '@fortawesome/react-fontawesome';
import { faCircleDollarToSlot } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames/bind';
import style from './CoinBadge.module.scss';
import { useCoins } from '@/app/hooks/useCoins';
import { formatCompactNumber, formatFullNumber } from '@/app/utils/formatNumber';

// react-fontawesome 0.1.x kéo fontawesome-common-types 0.3 lệch với 6.7 của icon pack
// -> IconProp không khớp. Cast any tạm thời cho tới khi nâng cấp react-fontawesome.
const FontAwesomeIcon = FontAwesomeIconBase as React.ComponentType<any>;

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
      <FontAwesomeIcon icon={faCircleDollarToSlot} className={cx('icon')} />
      <span className={cx('count')}>{formatCompactNumber(balance)}</span>
    </div>
  );
}

export default CoinBadge;
