'use client';

import {Form} from 'react-bootstrap';
import {useTranslations} from 'next-intl';
import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';

export type TagFormState = {
  name: string;
  examPartId: string | null;
  examTypeId: string;
  sortOrder: number | null;
};

type TagFormModalProps = {
  show: boolean;
  isEditing: boolean;
  formState: TagFormState;
  examTypes: Array<{id: string; name?: string}>;
  examParts: Array<{examPartId: string; name?: string}>;
  onChangeField: (field: keyof TagFormState, value: string | number | null) => void;
  onClose: () => void;
  onSubmit: () => void;
};

function TagFormModal({
  show,
  isEditing,
  formState,
  examTypes,
  examParts,
  onChangeField,
  onClose,
  onSubmit,
}: TagFormModalProps) {
  const t = useTranslations('AdminContent.tags.form');
  const tc = useTranslations('Common');
  return (
    <BaseModal
      show={show}
      onClose={onClose}
      title={isEditing ? t('editTitle') : t('createTitle')}
      maxWidth={680}
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
          <Form.Label>{t('examType')}</Form.Label>
          <Form.Select
            value={formState.examTypeId || ''}
            onChange={(e) => onChangeField('examTypeId', e.target.value)}
            disabled={isEditing}
            title={examTypes.find((et) => et.id === formState.examTypeId)?.name}
          >
            <option value="" disabled>
              {t('examTypePlaceholder')}
            </option>
            {examTypes.map((et) => (
              <option key={et.id} value={et.id}>
                {et.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>{t('examPart')}</Form.Label>
          <Form.Select
            value={formState.examPartId || ''}
            onChange={(e) => onChangeField('examPartId', e.target.value || null)}
          >
            <option value="">{t('sharedOption')}</option>
            {examParts.map((p) => (
              <option key={p.examPartId} value={p.examPartId}>
                {p.name}
              </option>
            ))}
          </Form.Select>
          <Form.Text className="text-muted">
            {t('examPartHelp')}
          </Form.Text>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>{t('name')}</Form.Label>
          <Form.Control
            value={formState.name}
            onChange={(e) => onChangeField('name', e.target.value)}
            placeholder={t('namePlaceholder')}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>{t('sortOrder')}</Form.Label>
          <Form.Control
            type="number"
            min={0}
            value={formState.sortOrder ?? ''}
            placeholder={t('sortOrderPlaceholder')}
            onChange={(event) => {
              const raw = event.target.value;
              if (raw === '') {
                onChangeField('sortOrder', null);
                return;
              }
              const parsed = Number(raw);
              onChangeField('sortOrder', Number.isFinite(parsed) ? parsed : null);
            }}
          />
          <Form.Text className="text-muted">
            {t('sortOrderHelp')}
          </Form.Text>
        </Form.Group>
    </BaseModal>
  );
}

export default TagFormModal;
