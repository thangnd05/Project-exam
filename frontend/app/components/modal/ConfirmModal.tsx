'use client';

import { useTranslations } from 'next-intl';
import { TriangleAlert, type LucideIcon } from 'lucide-react';
import classNames from 'classnames/bind';
import BaseModal from '@/app/components/modal/BaseModal';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import styles from './ConfirmModal.module.scss';

const cx = classNames.bind(styles);

// Màu nút xác nhận theo variant của modal.
const CONFIRM_VARIANT = {
    primary: 'primary',
    danger: 'danger',
    warning: 'warning',
    success: 'success',
} as const;

type ConfirmModalProps = {
    show?: boolean;
    onClose?: () => void;
    onConfirm?: () => void;
    title?: string;
    message?: React.ReactNode;
    icon?: LucideIcon;
    variant?: string;
    confirmText?: string;
    cancelText?: string;
};

// Khung (overlay, header, nút đóng, footer) dùng chung BaseModal; ở đây chỉ còn phần thân icon + lời nhắn.
const ConfirmModal = ({
    show,
    onClose,
    onConfirm,
    title,
    message = '',
    icon: Icon = TriangleAlert,
    variant = 'primary',
    confirmText,
    cancelText,
}: ConfirmModalProps) => {
    const t = useTranslations('Common');

    return (
        <BaseModal
            show={show}
            onClose={onClose}
            title={title ?? t('confirm')}
            maxWidth={480}
            footer={
                <>
                    <ButtonPrime variant="outline" size="lg" onClick={onClose}>
                        {cancelText ?? t('cancel')}
                    </ButtonPrime>
                    <ButtonPrime
                        variant={CONFIRM_VARIANT[variant as keyof typeof CONFIRM_VARIANT] ?? 'primary'}
                        size="lg"
                        onClick={onConfirm}
                    >
                        {confirmText ?? t('confirm')}
                    </ButtonPrime>
                </>
            }
        >
            <div className={cx('body')}>
                <div className={cx('iconCircle', variant)}>
                    <Icon size="1em" />
                </div>
                <p className={cx('message')}>{message}</p>
            </div>
        </BaseModal>
    );
};

export default ConfirmModal;
