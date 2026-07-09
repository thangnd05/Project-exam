import React from 'react';
import { IoTrashOutline } from 'react-icons/io5';
import ConfirmModal from './ConfirmModal';

const ConfirmDeleteModal = ({ show, onClose, onConfirm, title, message }) => (
    <ConfirmModal
        show={show}
        onClose={onClose}
        onConfirm={onConfirm}
        title={title || 'Xác nhận xóa'}
        message={message || 'Bạn có chắc chắn muốn xóa mục này? Hành động này không thể hoàn tác.'}
        icon={IoTrashOutline}
        variant="danger"
        confirmText="Đồng ý xóa"
    />
);

export default ConfirmDeleteModal;
