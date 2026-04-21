import {IoClose} from 'react-icons/io5';
import {Modal} from 'react-bootstrap';
import classNames from 'classnames/bind';
import styles from './CommonFormModal.module.scss';

const cx = classNames.bind(styles);

function CommonFormModal({
  show,
  onHide,
  title,
  icon: TitleIcon,
  children,
  footer,
}) {
  return (
    <Modal show={show} onHide={onHide} centered className={cx('modalCustom')}>
      <div className={cx('header')}>
        <div className={cx('titleWrapper')}>
          {TitleIcon ? <TitleIcon /> : null}
          <h3 className={cx('title')}>{title}</h3>
        </div>

        <button type="button" className={cx('closeBtn')} onClick={onHide}>
          <IoClose />
        </button>
      </div>

      <div className={cx('body')}>{children}</div>
      {footer}
    </Modal>
  );
}

export default CommonFormModal;
