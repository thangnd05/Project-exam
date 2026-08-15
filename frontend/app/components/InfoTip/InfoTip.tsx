'use client';

import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Info } from 'lucide-react';
import classNames from 'classnames/bind';
import styles from './InfoTip.module.scss';

const cx = classNames.bind(styles);

type InfoTipProps = {
  text?: string;
  placement?: React.ComponentProps<typeof OverlayTrigger>['placement'];
  className?: string;
};

function InfoTip({ text, placement = 'top', className }: InfoTipProps) {
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
