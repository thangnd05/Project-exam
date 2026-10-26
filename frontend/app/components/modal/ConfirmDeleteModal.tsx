'use client';

import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

type ConfirmDeleteModalProps = {
    show?: boolean;
    onClose?: () => void;
    onConfirm?: () => void;
    title?: string;
    message?: React.ReactNode;
};

const ConfirmDeleteModal = ({ show, onClose, onConfirm, title, message }: ConfirmDeleteModalProps) => {
    const t = useTranslations('Common.confirmDelete');
    return (
        <ConfirmModal
            show={show}
            onClose={onClose}
            onConfirm={onConfirm}
            title={title || t('title')}
            message={message || t('message')}
            icon={Trash2}
            variant="danger"
            confirmText={t('confirm')}
        />
    );
};

export default ConfirmDeleteModal;
