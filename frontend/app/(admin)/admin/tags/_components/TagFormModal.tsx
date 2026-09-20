'use client';

import {Form} from 'react-bootstrap';
import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';

export type TagFormState = {
  name: string;
  parentId: string | null;
  examTypeId: string;
  sortOrder: number | null;
};

type TagFormModalProps = {
  show: boolean;
  isEditing: boolean;
  formState: TagFormState;
  examTypes: Array<{id: string; name?: string}>;
  parentOptions: Array<{tagId: string; name?: string}>;
  onChangeField: (field: keyof TagFormState, value: string | number | null) => void;
  onClose: () => void;
  onSubmit: () => void;
};

function TagFormModal({
  show,
  isEditing,
  formState,
  examTypes,
  parentOptions,
  onChangeField,
  onClose,
  onSubmit,
}: TagFormModalProps) {
  return (
    <BaseModal
      show={show}
      onClose={onClose}
      title={isEditing ? 'Cập nhật Tag' : 'Tạo Tag mới'}
      maxWidth={680}
      footer={
        <ModalActionFooter
          onCancel={onClose}
          onSubmit={onSubmit}
          cancelLabel="Hủy"
          submitLabel={isEditing ? 'Lưu' : 'Tạo mới'}
        />
      }
    >
        <Form.Group className="mb-3">
          <Form.Label>Loại kỳ thi</Form.Label>
          <Form.Select
            value={formState.examTypeId || ''}
            onChange={(e) => onChangeField('examTypeId', e.target.value)}
            disabled={isEditing}
            title={examTypes.find((et) => et.id === formState.examTypeId)?.name}
          >
            <option value="" disabled>
              -- Chọn loại kỳ thi --
            </option>
            {examTypes.map((et) => (
              <option key={et.id} value={et.id}>
                {et.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Tên Tag</Form.Label>
          <Form.Control
            value={formState.name}
            onChange={(e) => onChangeField('name', e.target.value)}
            placeholder="VD: Ngữ pháp, Giới từ, AWS S3..."
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Tag cha (tuỳ chọn)</Form.Label>
          <Form.Select
            value={formState.parentId || ''}
            onChange={(e) => onChangeField('parentId', e.target.value || null)}
          >
            <option value="">-- Không có (root) --</option>
            {parentOptions.map((t) => (
              <option key={t.tagId} value={t.tagId}>
                {t.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
    </BaseModal>
  );
}

export default TagFormModal;
