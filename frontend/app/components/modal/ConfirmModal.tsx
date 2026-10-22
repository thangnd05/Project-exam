'use client';

import { useMounted } from '@/app/hooks/useMounted';
import ReactDOM from 'react-dom';
import { useTranslations } from 'next-intl';
import { IoClose, IoWarningOutline } from 'react-icons/io5';
import classNames from 'classnames/bind';
import styles from './ConfirmModal.module.scss';

const cx = classNames.bind(styles);

type ConfirmModalProps = {
    show?: boolean;
    onClose?: () => void;
    onConfirm?: () => void;
    title?: string;
    message?: React.ReactNode;
    icon?: React.ElementType;
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
    icon: Icon = IoWarningOutline,
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
                    <button type="button" className={cx('closeBtn')} onClick={onClose} aria-label={t('close')}>
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
                        {cancelText ?? t('cancel')}
                    </button>
                    <button type="button" className={cx('btnConfirm', variant)} onClick={onConfirm}>
                        {confirmText ?? t('confirm')}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default ConfirmModal;
