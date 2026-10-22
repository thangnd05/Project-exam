'use client';

import {Form} from 'react-bootstrap';
import {useTranslations} from 'next-intl';
import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';

const scoringMethodOptions = ['DEFAULT', 'TOEIC_SCALE'] as const;

export type ExamTypeFormState = {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  duration_minutes: number | string;
  scoring_method: string;
  score_min: number | string;
  score_max: number | string;
  flexible: boolean;
  parent_id: string;
};

type ExamTypeFormModalProps = {
  show: boolean;
  isEditing: boolean;
  formState: ExamTypeFormState;
  parentOptions?: Array<{exam_type_id: string; name: string}>;
  editingHasChildren?: boolean;
  onChangeField: (
    field: keyof ExamTypeFormState,
    value: string | boolean,
  ) => void;
  onClose: () => void;
  onSubmit: () => void;
};

function ExamTypeFormModal({
  show,
  isEditing,
  formState,
  parentOptions = [],
  editingHasChildren = false,
  onChangeField,
  onClose,
  onSubmit,
}: ExamTypeFormModalProps) {
  const t = useTranslations('AdminContent.examTypes.form');
  const tc = useTranslations('Common');
  return (
    <BaseModal
      show={show}
      onClose={onClose}
      title={isEditing ? t('editTitle') : t('createTitle')}
      maxWidth={640}
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
        <Form.Label>{t('name')}</Form.Label>
        <Form.Control
          value={formState.name}
          onChange={(event) => onChangeField('name', event.target.value)}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>{t('slug')}</Form.Label>
        <Form.Control
          value={formState.slug}
          placeholder={t('slugPlaceholder')}
          onChange={(event) => onChangeField('slug', event.target.value)}
        />
        <Form.Text muted>
          {t('slugHelp')}
          {isEditing ? ` ${t('slugChangeWarning')}` : ''}
        </Form.Text>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>{t('description')}</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={formState.description}
          onChange={(event) => onChangeField('description', event.target.value)}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>{t('imageUrl')}</Form.Label>
        <Form.Control
          type="url"
          placeholder="https://..."
          value={formState.image_url}
          onChange={(event) => onChangeField('image_url', event.target.value)}
        />
        {formState.image_url ? (
          <div className="mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- xem trước URL admin dán vào, host bất kỳ, có onError ẩn ảnh lỗi */}
            <img
              src={formState.image_url}
              alt={t('imagePreview')}
              style={{
                maxHeight: 80,
                maxWidth: '100%',
                borderRadius: 8,
                objectFit: 'cover',
              }}
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
          </div>
        ) : null}
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>{t('duration')}</Form.Label>
        <Form.Control
          type="number"
          min={1}
          value={formState.duration_minutes}
          onChange={(event) =>
            onChangeField('duration_minutes', event.target.value)
          }
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>{t('parent')}</Form.Label>
        {editingHasChildren ? (
          <Form.Control
            plaintext
            readOnly
            value={t('isParent')}
          />
        ) : (
          <Form.Select
            value={formState.parent_id || ''}
            onChange={(event) => onChangeField('parent_id', event.target.value)}
          >
            <option value="">{t('noParent')}</option>
            {parentOptions.map((option) => (
              <option key={option.exam_type_id} value={option.exam_type_id}>
                {option.name}
              </option>
            ))}
          </Form.Select>
        )}
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>{t('scoringMethod')}</Form.Label>
        <Form.Select
          value={formState.scoring_method}
          onChange={(event) =>
            onChangeField('scoring_method', event.target.value)
          }
        >
          {scoringMethodOptions.map((value) => (
            <option key={value} value={value}>
              {t(`scoringMethods.${value}`)}
            </option>
          ))}
        </Form.Select>
        <Form.Text muted>
          {formState.scoring_method === 'TOEIC_SCALE'
            ? t('scoringHelp.TOEIC_SCALE')
            : t('scoringHelp.DEFAULT')}
        </Form.Text>
      </Form.Group>
      <div className="d-flex gap-3 mb-3">
        <Form.Group className="flex-fill">
          <Form.Label>{t('scoreMin')}</Form.Label>
          <Form.Control
            type="number"
            min={0}
            value={formState.score_min}
            onChange={(event) => onChangeField('score_min', event.target.value)}
          />
        </Form.Group>
        <Form.Group className="flex-fill">
          <Form.Label>{t('scoreMax')}</Form.Label>
          <Form.Control
            type="number"
            min={1}
            value={formState.score_max}
            onChange={(event) => onChangeField('score_max', event.target.value)}
          />
        </Form.Group>
      </div>
      <Form.Group>
        <Form.Check
          type="switch"
          id="exam-type-flexible"
          label={t('flexible')}
          checked={Boolean(formState.flexible)}
          onChange={(event) => onChangeField('flexible', event.target.checked)}
        />
      </Form.Group>
    </BaseModal>
  );
}

export default ExamTypeFormModal;
