import React from 'react';
import ReactDOM from 'react-dom';
import { IoClose, IoSwapHorizontalOutline } from 'react-icons/io5';
import classNames from 'classnames/bind';
import styles from './ConfirmActionModal.module.scss';

const cx = classNames.bind(styles);

const ConfirmActionModal = ({
    show,
    onClose,
    onConfirm,
    title,
    message,
    icon: Icon = IoSwapHorizontalOutline,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy bỏ',
}) => {
    if (!show) return null;

    return ReactDOM.createPortal(
        <div className={cx('overlay')} onClick={onClose}>
            <div className={cx('content')} onClick={(e) => e.stopPropagation()}>
                <div className={cx('header')}>
                    <div className={cx('titleWrapper')}>
                        <Icon className={cx('headerIcon')} />
                        <h3 className={cx('title')}>{title || 'Xác nhận'}</h3>
                    </div>
                    <button type="button" className={cx('closeBtn')} onClick={onClose} aria-label="Đóng">
                        <IoClose />
                    </button>
                </div>
                <div className={cx('body')}>
                    <div className={cx('iconCircle')}>
                        <Icon />
                    </div>
                    <p className={cx('message')}>{message}</p>
                </div>
                <div className={cx('footer')}>
                    <button type="button" className={cx('btnCancel')} onClick={onClose}>
                        {cancelText}
                    </button>
                    <button type="button" className={cx('btnConfirm')} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default ConfirmActionModal;
