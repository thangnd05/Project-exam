import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Info } from 'lucide-react';
import classNames from 'classnames/bind';
import styles from './InfoTip.module.scss';

const cx = classNames.bind(styles);

function InfoTip({ text, placement = 'top', className }) {
  if (!text) return null;
  return (
    <OverlayTrigger
      placement={placement}
      overlay={<Tooltip className={cx('tooltip')}>{text}</Tooltip>}
    >
      <span
        className={cx('icon', className)}
        tabIndex={0}
        role="img"
        aria-label={text}
      >
        <Info size={14} aria-hidden />
      </span>
    </OverlayTrigger>
  );
}

export default InfoTip;
