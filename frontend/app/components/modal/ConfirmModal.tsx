'use client';

import { useMounted } from '@/app/hooks/useMounted';
import ReactDOM from 'react-dom';
import { useTranslations } from 'next-intl';
import { X, TriangleAlert, type LucideIcon } from 'lucide-react';
import classNames from 'classnames/bind';
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
  const mounted = useMounted();

    if (!show || !mounted) return null;

    return ReactDOM.createPortal(
        <div className={cx('overlay')} onClick={onClose}>
            <div className={cx('content')} onClick={(e) => e.stopPropagation()}>
                <div className={cx('header')}>
                    <div className={cx('titleWrapper')}>
                        <h3 className={cx('title')}>{title ?? t('confirm')}</h3>
                    </div>
                    {/* Nút đóng trong suốt trên dải gradient của header. */}
                    <ButtonPrime variant="onDark" size="icon" onClick={onClose} aria-label={t('close')}>
                        <X size={20} />
                    </ButtonPrime>
                </div>
                <div className={cx('body')}>
                    <div className={cx('iconCircle', variant)}>
                        <Icon size="1em" />
                    </div>
                    <p className={cx('message')}>{message}</p>
                </div>
                <div className={cx('footer')}>
                    <ButtonPrime variant="soft" size="lg" className={cx('btnCancel')} onClick={onClose}>
                        {cancelText ?? t('cancel')}
                    </ButtonPrime>
                    <ButtonPrime
                        variant={CONFIRM_VARIANT[variant as keyof typeof CONFIRM_VARIANT] ?? 'primary'}
                        size="lg"
                        className={cx('btnConfirm')}
                        onClick={onConfirm}
                    >
                        {confirmText ?? t('confirm')}
                    </ButtonPrime>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default ConfirmModal;
