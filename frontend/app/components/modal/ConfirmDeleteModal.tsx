'use client';

import { IoTrashOutline } from 'react-icons/io5';
import ConfirmModal from './ConfirmModal';

type ConfirmDeleteModalProps = {
    show?: boolean;
    onClose?: () => void;
    onConfirm?: () => void;
    title?: string;
    message?: React.ReactNode;
};

const ConfirmDeleteModal = ({ show, onClose, onConfirm, title, message }: ConfirmDeleteModalProps) => (
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
