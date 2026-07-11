import { IoSwapHorizontalOutline } from 'react-icons/io5';
import ConfirmModal from './ConfirmModal';

const ConfirmActionModal = ({
    show,
    onClose,
    onConfirm,
    title,
    message,
    icon = IoSwapHorizontalOutline,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy bỏ',
}) => (
    <ConfirmModal
        show={show}
        onClose={onClose}
        onConfirm={onConfirm}
        title={title || 'Xác nhận'}
        message={message}
        icon={icon}
        variant="primary"
        confirmText={confirmText}
        cancelText={cancelText}
    />
);

export default ConfirmActionModal;
