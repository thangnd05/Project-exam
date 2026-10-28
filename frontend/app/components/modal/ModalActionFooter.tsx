'use client';

import { useTranslations } from 'next-intl';
import ButtonPrime from '@/app/components/Button/ButtonPrime';

// Hai nút được BaseModal chia đều chiều ngang footer.

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
        onClick={onCancel}
        disabled={loading}
      >
        {cancelLabel ?? t('cancelShort')}
      </ButtonPrime>

      <ButtonPrime
        type="button"
        variant="primary"
        size="lg"
        onClick={onSubmit}
        disabled={loading}
      >
        {loading ? loadingLabel || submitText : submitText}
      </ButtonPrime>
    </>
  );
}

export default ModalActionFooter;
