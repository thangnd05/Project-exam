import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleDollarToSlot } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames/bind';
import style from './CoinBadge.module.scss';
import { useCoins } from '~/hooks/useCoins';

const cx = classNames.bind(style);

// Badge 🪙 hiển thị số xu user đang có.
function CoinBadge({ className }) {
  const { balance } = useCoins();

  return (
    <div
      className={cx('coinBadge', className)}
      title={`Bạn đang có ${balance} xu`}
    >
      <FontAwesomeIcon icon={faCircleDollarToSlot} className={cx('icon')} />
      <span className={cx('count')}>{balance}</span>
    </div>
  );
}

export default CoinBadge;
