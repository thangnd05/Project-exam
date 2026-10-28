'use client';

import { useMounted } from '@/app/hooks/useMounted';
import {useEffect} from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import classNames from 'classnames/bind';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import styles from './BaseModal.module.scss';

const cx = classNames.bind(styles);

type BaseModalProps = {
  show?: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  headerExtra?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number | string;
  closeOnOverlay?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
  // exam (mặc định, khung chung của cả app): header nền tối như hero, góc vuông vắn, nút tách hai bên.
  // plain: như exam nhưng góc bo tròn lớn. default: header dải gradient (kiểu cũ, chỉ dùng khi cần).
  variant?: 'default' | 'plain' | 'exam';
  children?: React.ReactNode;
};

function BaseModal({
  show,
  onClose,
  title,
  headerExtra,
  footer,
  maxWidth,
  closeOnOverlay = true,
  closeOnEsc = true,
  showCloseButton = true,
  variant = 'exam',
  children,
}: BaseModalProps) {
  const tCommon = useTranslations('Common');

  useEffect(() => {
    if (!show) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (closeOnEsc && event.key === 'Escape') {
        onClose?.();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [show, closeOnEsc, onClose]);

  const mounted = useMounted();

  if (!show || !mounted) return null;

  return ReactDOM.createPortal(
    <div
      className={cx('modalOverlay')}
      onClick={closeOnOverlay ? onClose : undefined}
    >
      <div
        className={cx('modalContent', {plain: variant !== 'default', exam: variant === 'exam'})}
        style={maxWidth ? {maxWidth} : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={cx('header')}>
          <div className={cx('titleWrapper')}>
            <h3 className={cx('title')}>{title}</h3>
            {headerExtra}
          </div>
          {showCloseButton && (
            <ButtonPrime
              variant={variant === 'default' ? 'outline' : 'onDark'}
              size="icon"
              shape={variant === 'exam' ? 'rounded' : 'pill'}
              className={cx('closeBtn')}
              onClick={onClose}
              aria-label={tCommon('close')}
            >
              <X size={18} />
            </ButtonPrime>
          )}
        </div>

        <div className={cx('body')}>{children}</div>

        {footer ? <div className={cx('footer')}>{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

export default BaseModal;
