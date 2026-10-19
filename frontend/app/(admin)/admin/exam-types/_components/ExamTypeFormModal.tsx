'use client';

import {Form} from 'react-bootstrap';
import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';

const scoringMethodOptions = [
  {value: 'DEFAULT', label: 'Tuyến tính theo thang tối thiểu–tối đa'},
  {value: 'TOEIC_SCALE', label: 'Quy đổi theo bảng (TOEIC)'},
];

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
  return (
    <BaseModal
      show={show}
      onClose={onClose}
      title={isEditing ? 'Cập nhật loại kỳ thi' : 'Tạo loại kỳ thi'}
      maxWidth={640}
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
        <Form.Label>Tên</Form.Label>
        <Form.Control
          value={formState.name}
          onChange={(event) => onChangeField('name', event.target.value)}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Slug (đường dẫn)</Form.Label>
        <Form.Control
          value={formState.slug}
          placeholder="vd: saa-c03"
          onChange={(event) => onChangeField('slug', event.target.value)}
        />
        <Form.Text muted>
          Dùng trong URL, vd /exam-types/aws/saa-c03. Chỉ gồm chữ thường không dấu, số và gạch ngang.
          {isEditing ? ' Đổi slug thì link dạng slug cũ sẽ không mở được nữa.' : ''}
        </Form.Text>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Mô tả</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={formState.description}
          onChange={(event) => onChangeField('description', event.target.value)}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>URL ảnh đại diện (tùy chọn)</Form.Label>
        <Form.Control
          type="url"
          placeholder="https://..."
          value={formState.image_url}
          onChange={(event) => onChangeField('image_url', event.target.value)}
        />
        {formState.image_url ? (
          <div className="mt-2">
            <img
              src={formState.image_url}
              alt="Xem trước ảnh"
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
        <Form.Label>Thời lượng (phút)</Form.Label>
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
        <Form.Label>Thuộc nhóm cha (tùy chọn)</Form.Label>
        {editingHasChildren ? (
          <Form.Control
            plaintext
            readOnly
            value="Đang là nhóm cha (chứa loại con)"
          />
        ) : (
          <Form.Select
            value={formState.parent_id || ''}
            onChange={(event) => onChangeField('parent_id', event.target.value)}
          >
            <option value="">-- Không có (loại độc lập / gốc) --</option>
            {parentOptions.map((t) => (
              <option key={t.exam_type_id} value={t.exam_type_id}>
                {t.name}
              </option>
            ))}
          </Form.Select>
        )}
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Phương thức chấm điểm</Form.Label>
        <Form.Select
          value={formState.scoring_method}
          onChange={(event) =>
            onChangeField('scoring_method', event.target.value)
          }
        >
          {scoringMethodOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Form.Select>
        <Form.Text muted>
          {formState.scoring_method === 'TOEIC_SCALE'
            ? 'Điểm quy đổi theo bảng; thang dưới đây chỉ dùng để hiển thị.'
            : 'Điểm = tối thiểu + (số câu đúng / tổng số câu) × (tối đa − tối thiểu).'}
        </Form.Text>
      </Form.Group>
      <div className="d-flex gap-3 mb-3">
        <Form.Group className="flex-fill">
          <Form.Label>Điểm tối thiểu</Form.Label>
          <Form.Control
            type="number"
            min={0}
            value={formState.score_min}
            onChange={(event) => onChangeField('score_min', event.target.value)}
          />
        </Form.Group>
        <Form.Group className="flex-fill">
          <Form.Label>Điểm tối đa</Form.Label>
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
          label="Loại linh hoạt (cho user tự tạo bài  ẩn khỏi dropdown loại kỳ thi chuẩn)"
          checked={Boolean(formState.flexible)}
          onChange={(event) => onChangeField('flexible', event.target.checked)}
        />
      </Form.Group>
    </BaseModal>
  );
}

export default ExamTypeFormModal;
