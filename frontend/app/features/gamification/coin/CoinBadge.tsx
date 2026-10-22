'use client';

import classNames from 'classnames/bind';
import { useLocale, useTranslations } from 'next-intl';
import style from '@/app/features/gamification/coin/CoinBadge.module.scss';
import { useCoins } from '@/app/features/gamification/coin/hooks/useCoins';
import { formatCompactNumber, formatFullNumber } from '@/app/utils/formatNumber';
import { FaCircleDollarToSlot } from 'react-icons/fa6';

const cx = classNames.bind(style);

type CoinBadgeProps = {
  className?: string;
  variant?: 'default' | 'onDark';
};

function CoinBadge({ className, variant = 'default' }: CoinBadgeProps) {
  const { balance } = useCoins();
  const t = useTranslations('Gamification.coins');
  const locale = useLocale();
  const fullBalance = formatFullNumber(balance, locale);

  return (
    <div
      className={cx('coinBadge', variant === 'onDark' && 'onDark', className)}
      title={t('badgeTitle', { balance: fullBalance })}
    >
      <FaCircleDollarToSlot className={cx('icon')} />
      <span className={cx('count')}>{formatCompactNumber(balance, locale)}</span>
    </div>
  );
}

export default CoinBadge;
