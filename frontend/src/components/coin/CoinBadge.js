import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleDollarToSlot } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames/bind';
import style from './CoinBadge.module.scss';
import { useCoins } from '~/shared/hooks/useCoins';

const cx = classNames.bind(style);

function CoinBadge({ className }) {
  const { balance } = useCoins();

  return (
    <div
      className={cx('coinBadge', className)}
      title={`click để xem nhiệm vụ`}
    >
      <FontAwesomeIcon icon={faCircleDollarToSlot} className={cx('icon')} />
      <span className={cx('count')}>{balance}</span>
    </div>
  );
}

export default CoinBadge;
