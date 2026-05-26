import React from 'react';
import ReactDOM from 'react-dom';
import { IoTrashOutline, IoClose, IoWarningOutline } from 'react-icons/io5';
import classNames from 'classnames/bind';
import styles from './ConfirmDeleteModal.module.scss';

const cx = classNames.bind(styles);

const ConfirmDeleteModal = ({ show, onClose, onConfirm, title, message }) => {
    if (!show) return null;

    return ReactDOM.createPortal(
        <div className={cx('overlay')} onClick={onClose}>
            <div className={cx('content')} onClick={(e) => e.stopPropagation()}>
                <div className={cx('header')}>
                    <div className={cx('titleWrapper')}>
                        <IoWarningOutline />
                        <h3 className={cx('title')}>{title || 'Xác nhận xóa'}</h3>
                    </div>
                    <button type="button" className={cx('closeBtn')} onClick={onClose} aria-label="Đóng">
                        <IoClose />
                    </button>
                </div>
                <div className={cx('body')}>
                    <div className={cx('iconCircle')}>
                        <IoTrashOutline />
                    </div>
                    <p className={cx('message')}>
                        {message || 'Bạn có chắc chắn muốn xóa mục này? Hành động này không thể hoàn tác.'}
                    </p>
                </div>
                <div className={cx('footer')}>
                    <button type="button" className={cx('btnCancel')} onClick={onClose}>
                        Hủy bỏ
                    </button>
                    <button type="button" className={cx('btnDelete')} onClick={onConfirm}>
                        Đồng ý xóa
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default ConfirmDeleteModal;
