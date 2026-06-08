import {useEffect} from 'react';
import ReactDOM from 'react-dom';
import {IoClose} from 'react-icons/io5';
import classNames from 'classnames/bind';
import styles from './BaseModal.module.scss';

const cx = classNames.bind(styles);

/**
 * Khung modal dùng chung (kiểu "Tạo bài kiểm tra"): portal + header gradient xanh,
 * nút đóng vuông xoay 90°, animation mở, body cuộn được, footer tuỳ chọn.
 *
 * Cách dùng:
 *   <BaseModal show={open} onClose={close} title="Tiêu đề" icon={SomeIcon}
 *              headerExtra={<Badge/>} maxWidth={880} footer={<Buttons/>}>
 *     ...nội dung...
 *   </BaseModal>
 */
function BaseModal({
  show,
  onClose,
  title,
  icon: Icon,
  headerExtra,
  footer,
  maxWidth,
  closeOnOverlay = true,
  closeOnEsc = true,
  children,
}) {
  // Đóng bằng phím ESC + khóa cuộn nền khi modal mở (giống react-bootstrap Modal).
  useEffect(() => {
    if (!show) return undefined;

    const handleKeyDown = (event) => {
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

  if (!show) return null;

  return ReactDOM.createPortal(
    <div
      className={cx('modalOverlay')}
      onClick={closeOnOverlay ? onClose : undefined}
    >
      <div
        className={cx('modalContent')}
        style={maxWidth ? {maxWidth} : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={cx('header')}>
          <div className={cx('titleWrapper')}>
            {Icon ? <Icon /> : null}
            <h3 className={cx('title')}>{title}</h3>
            {headerExtra}
          </div>
          <button
            type="button"
            className={cx('closeBtn')}
            onClick={onClose}
            aria-label="Đóng"
          >
            <IoClose />
          </button>
        </div>

        <div className={cx('body')}>{children}</div>

        {footer ? <div className={cx('footer')}>{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

export default BaseModal;
