import {Form} from 'react-bootstrap';
import BaseModal from '~/shared/ui/modal/BaseModal';
import ModalActionFooter from '~/shared/ui/modal/ModalActionFooter';

function TagFormModal({
  show,
  isEditing,
  formState,
  examTypes,
  parentOptions,
  onChangeField,
  onClose,
  onSubmit,
}) {
  return (
    <BaseModal
      show={show}
      onClose={onClose}
      title={isEditing ? 'Cập nhật Tag' : 'Tạo Tag mới'}
      maxWidth={550}
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
        <Form.Group>
          <Form.Label>Thứ tự học (tuỳ chọn)</Form.Label>
          <Form.Control
            type="number"
            value={formState.sortOrder ?? ''}
            onChange={(e) =>
              onChangeField(
                'sortOrder',
                e.target.value === '' ? null : Number(e.target.value),
              )
            }
            placeholder="Nhỏ = học trước"
          />
          <Form.Text className="text-muted">
            Ép thứ tự học nền tảng trong kế hoạch (VD: VPC trước VPC-Endpoint). Để
            trống = xếp theo mức độ yếu.
          </Form.Text>
        </Form.Group>
    </BaseModal>
  );
}

export default TagFormModal;
