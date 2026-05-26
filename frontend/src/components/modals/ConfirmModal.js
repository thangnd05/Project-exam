import React from 'react';
import ReactDOM from 'react-dom';
import { IoClose, IoWarningOutline } from 'react-icons/io5';
import classNames from 'classnames/bind';
import styles from './ConfirmModal.module.scss';

const cx = classNames.bind(styles);

const ConfirmModal = ({
    show,
    onClose,
    onConfirm,
    title = 'Xác nhận',
    message = '',
    icon: Icon = IoWarningOutline,
    variant = 'primary',
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
                        <h3 className={cx('title')}>{title}</h3>
                    </div>
                    <button type="button" className={cx('closeBtn')} onClick={onClose} aria-label="Đóng">
                        <IoClose />
                    </button>
                </div>
                <div className={cx('body')}>
                    <div className={cx('iconCircle', variant)}>
                        <Icon />
                    </div>
                    <p className={cx('message')}>{message}</p>
                </div>
                <div className={cx('footer')}>
                    <button type="button" className={cx('btnCancel')} onClick={onClose}>
                        {cancelText}
                    </button>
                    <button type="button" className={cx('btnConfirm', variant)} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default ConfirmModal;
