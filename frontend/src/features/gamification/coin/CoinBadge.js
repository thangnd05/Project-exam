import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleDollarToSlot } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames/bind';
import style from './CoinBadge.module.scss';
import { useCoins } from '~/shared/hooks/useCoins';
import { formatCompactNumber, formatFullNumber } from '~/shared/utils/formatNumber';

const cx = classNames.bind(style);

function CoinBadge({ className, variant = 'default' }) {
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
