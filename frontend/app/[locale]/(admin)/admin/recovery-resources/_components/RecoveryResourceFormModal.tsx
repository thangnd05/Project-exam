'use client';

import {useTranslations} from 'next-intl';
import {Form} from 'react-bootstrap';
import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import TagSelector from '@/app/features/tests/TagSelector/TagSelector';
import type {TagResponse} from '@/app/types';
import type {RecoveryExamTypeOption} from '@/app/[locale]/(admin)/admin/recovery-resources/_hooks/useRecoveryResources';

export interface RecoveryResourceFormState {
  title: string;
  description: string;
  url: string;
  tagIds: string[];
}

interface RecoveryResourceFormModalProps {
  show: boolean;
  isEditing: boolean;
  formState: RecoveryResourceFormState;
  examTypes: RecoveryExamTypeOption[];
  formExamTypeId: string;
  onExamTypeChange: (examTypeId: string) => void;
  availableTags: TagResponse[];
  selectedFile: File | null;
  onChangeField: (field: string, value: string) => void;
  onFileChange: (file: File | null) => void;
  onToggleTag: (tagId: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
}

function RecoveryResourceFormModal({
  show,
  isEditing,
  formState,
  examTypes,
  formExamTypeId,
  onExamTypeChange,
  availableTags,
  selectedFile,
  onChangeField,
  onFileChange,
  onToggleTag,
  onClose,
  onSubmit,
  submitting,
}: RecoveryResourceFormModalProps) {
  const t = useTranslations('AdminUsers');
  const tCommon = useTranslations('Common');
  const selectedTagIds = formState.tagIds || [];

  return (
    <BaseModal
      show={show}
      onClose={onClose}
      title={isEditing ? t('recoveryResources.form.editTitle') : t('recoveryResources.form.createTitle')}
      maxWidth={800}
      footer={
        <ModalActionFooter
          onCancel={onClose}
          onSubmit={onSubmit}
          cancelLabel={tCommon('cancelShort')}
          submitLabel={isEditing ? tCommon('save') : t('shared.createNew')}
          loadingLabel={t('shared.saving')}
          loading={submitting}
        />
      }
    >
        <Form.Group className="mb-3">
          <Form.Label>{t('recoveryResources.form.title')}</Form.Label>
          <Form.Control
            value={formState.title}
            onChange={(e) => onChangeField('title', e.target.value)}
            placeholder={t('recoveryResources.form.titlePlaceholder')}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>{t('recoveryResources.form.description')}</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={formState.description}
            onChange={(e) => onChangeField('description', e.target.value)}
            placeholder={t('recoveryResources.form.descriptionPlaceholder')}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>{t('recoveryResources.form.uploadFile')}</Form.Label>
          <Form.Control
            type="file"
            accept=".md,.markdown,.pdf,.doc,.docx,image/*,audio/*,video/*,text/markdown"
            onChange={(e) => onFileChange((e.target as HTMLInputElement).files![0] || null)}
          />
          <Form.Text className="text-muted">
            {t('recoveryResources.form.supportedFormats')}
          </Form.Text>
          {selectedFile && (
            <Form.Text className="text-muted d-block">{selectedFile.name}</Form.Text>
          )}
          {isEditing && !selectedFile && formState.url && (
            <Form.Text className="text-muted d-block mt-1">
              {t.rich('recoveryResources.form.currentFile', {
                link: (chunks) => <a href={formState.url} target="_blank" rel="noreferrer">{chunks}</a>,
              })}
            </Form.Text>
          )}
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>{t('recoveryResources.form.orUrl')}</Form.Label>
          <Form.Control
            value={formState.url}
            onChange={(e) => onChangeField('url', e.target.value)}
            placeholder="https://..."
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>{t('recoveryResources.form.examType')}</Form.Label>
          <Form.Select
            value={formExamTypeId}
            onChange={(e) => onExamTypeChange(e.target.value)}
          >
            <option value="">{t('recoveryResources.form.selectExamType')}</option>
            {examTypes.map((et) => (
              <option key={et.id} value={et.id}>
                {et.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          {!formExamTypeId ? (
            <Form.Text className="text-muted">
              {t('recoveryResources.form.selectExamTypeFirst')}
            </Form.Text>
          ) : availableTags.length > 0 ? (
            <>
              <TagSelector
                tags={availableTags}
                selectedIds={selectedTagIds}
                onToggle={onToggleTag}
                label={t('recoveryResources.form.tagLabel')}
              />
              <Form.Text className="text-muted">
                {t('recoveryResources.form.tagHint')}
              </Form.Text>
            </>
          ) : (
            <Form.Text className="text-muted">
              {t('recoveryResources.form.noTags')}
            </Form.Text>
          )}
        </Form.Group>
    </BaseModal>
  );
}

export default RecoveryResourceFormModal;
