'use client';

import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import styles from './CommonFormModal.module.scss';
import ButtonPrime from '@/app/components/Button/ButtonPrime';

const cx = classNames.bind(styles);

type ModalActionFooterProps = {
  cancelLabel?: string;
  submitLabel?: string;
  loadingLabel?: string;
  loading?: boolean;
  onCancel?: () => void;
  onSubmit?: () => void;
};

function ModalActionFooter({
  cancelLabel,
  submitLabel,
  loadingLabel,
  loading = false,
  onCancel,
  onSubmit,
}: ModalActionFooterProps) {
  const t = useTranslations('Common');
  const submitText = submitLabel ?? t('save');

  return (
    <>
      <ButtonPrime
        type="button"
        variant="outline"
        size="lg"
        className={cx('btnCancel')}
        onClick={onCancel}
        disabled={loading}
      >
        {cancelLabel ?? t('cancelShort')}
      </ButtonPrime>

      <ButtonPrime
        type="button"
        variant="primary"
        size="lg"
        className={cx('btnSubmit')}
        onClick={onSubmit}
        disabled={loading}
      >
        {loading ? loadingLabel || submitText : submitText}
      </ButtonPrime>
    </>
  );
}

export default ModalActionFooter;
