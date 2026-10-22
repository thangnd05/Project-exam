'use client';

import {Form} from 'react-bootstrap';
import {useTranslations} from 'next-intl';
import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';

export type ExamCategoryFormState = {
  code: string;
  name: string;
  description: string;
  guestAllowed: boolean;
  certificateEligible: boolean;
  displayOrder: number;
};

type ExamCategoryFormModalProps = {
  show: boolean;
  isEditing: boolean;
  formState: ExamCategoryFormState;
  onChangeField: (field: keyof ExamCategoryFormState, value: string | number | boolean) => void;
  onClose: () => void;
  onSubmit: () => void;
};

function ExamCategoryFormModal({
  show,
  isEditing,
  formState,
  onChangeField,
  onClose,
  onSubmit,
}: ExamCategoryFormModalProps) {
  const t = useTranslations('AdminContent.examCategories.form');
  const tc = useTranslations('Common');
  return (
    <BaseModal
      show={show}
      onClose={onClose}
      title={isEditing ? t('editTitle') : t('createTitle')}
      maxWidth={550}
      footer={
        <ModalActionFooter
          onCancel={onClose}
          onSubmit={onSubmit}
          cancelLabel={tc('cancelShort')}
          submitLabel={isEditing ? tc('save') : t('create')}
        />
      }
    >
        <Form.Group className="mb-3">
          <Form.Label>{t('code')}</Form.Label>
          <Form.Control
            value={formState.code}
            onChange={(event) => onChangeField('code', event.target.value)}
            placeholder={t('codePlaceholder')}
            disabled={isEditing}
          />
          <Form.Text className="text-muted">
            {t('codeHelp')}
          </Form.Text>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>{t('name')}</Form.Label>
          <Form.Control
            value={formState.name}
            onChange={(event) => onChangeField('name', event.target.value)}
            placeholder={t('namePlaceholder')}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>{t('description')}</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={formState.description}
            onChange={(event) => onChangeField('description', event.target.value)}
            placeholder={t('descriptionPlaceholder')}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Check
            type="switch"
            id="guest-allowed-switch"
            label={t('guestAllowed')}
            checked={!!formState.guestAllowed}
            onChange={(event) => onChangeField('guestAllowed', event.target.checked)}
          />
          <Form.Text className="text-muted">
            {t('guestAllowedHelp')}
          </Form.Text>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Check
            type="switch"
            id="certificate-eligible-switch"
            label={t('certificateEligible')}
            checked={!!formState.certificateEligible}
            onChange={(event) => onChangeField('certificateEligible', event.target.checked)}
          />
          <Form.Text className="text-muted">
            {t('certificateEligibleHelp')}
          </Form.Text>
        </Form.Group>
        <Form.Group>
          <Form.Label>{t('displayOrder')}</Form.Label>
          <Form.Control
            type="number"
            value={formState.displayOrder ?? 0}
            onChange={(event) =>
              onChangeField('displayOrder', Number(event.target.value) || 0)
            }
          />
        </Form.Group>
    </BaseModal>
  );
}

export default ExamCategoryFormModal;
