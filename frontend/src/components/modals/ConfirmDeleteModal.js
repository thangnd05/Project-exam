import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { IoTrashOutline, IoWarningOutline } from 'react-icons/io5';
import classNames from 'classnames/bind';
import styles from './ConfirmDeleteModal.module.scss';

const cx = classNames.bind(styles);

const ConfirmDeleteModal = ({ show, onClose, onConfirm, title, message }) => {
    return (
        <Modal show={show} onHide={onClose} centered className={cx('modal')}>
            <Modal.Header closeButton className={cx('header')}>
                <Modal.Title className={cx('title')}>
                    <IoWarningOutline className={cx('warning-icon')} />
                    {title || 'Xác nhận xóa'}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className={cx('body')}>
                <div className={cx('content')}>
                    <div className={cx('trash-icon-wrapper')}>
                        <IoTrashOutline />
                    </div>
                    <p>{message || 'Bạn có chắc chắn muốn xóa mục này? Hành động này không thể hoàn tác.'}</p>
                </div>
            </Modal.Body>
            <Modal.Footer className={cx('footer')}>
                <Button variant="light" onClick={onClose} className={cx('btn-cancel')}>
                    Hủy bỏ
                </Button>
                <Button variant="danger" onClick={onConfirm} className={cx('btn-delete')}>
                    Đồng ý xóa
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ConfirmDeleteModal;
