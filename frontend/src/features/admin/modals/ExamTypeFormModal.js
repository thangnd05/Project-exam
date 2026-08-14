
import {Form} from 'react-bootstrap';
import BaseModal from '~/shared/ui/modal/BaseModal';
import ModalActionFooter from '~/shared/ui/modal/ModalActionFooter';

const scoringMethodOptions = ['DEFAULT', 'TOEIC_SCALE', 'IELTS_BAND', 'AWS_SCALE'];

function ExamTypeFormModal({
  show,
  isEditing,
  formState,
  parentOptions = [],
  editingHasChildren = false,
  onChangeField,
  onClose,
  onSubmit,
}) {
  return (
    <BaseModal
      show={show}
      onClose={onClose}
      title={isEditing ? 'Cập nhật loại kỳ thi' : 'Tạo loại kỳ thi'}
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
          <Form.Label>Tên</Form.Label>
          <Form.Control
            value={formState.name}
            onChange={(event) => onChangeField('name', event.target.value)}
          />
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
          <Form.Text muted>
            Ảnh hiển thị cho kỳ thi. Để trống sẽ dùng chữ cái đầu của tên.
          </Form.Text>
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
            <Form.Control plaintext readOnly value="Đang là nhóm cha (chứa loại con)" />
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
          <Form.Text muted>
            {editingHasChildren
              ? 'Loại này đang chứa loại con nên không thể trở thành con của loại khác.'
              : 'Chọn nhóm cha để gom (vd các cert AWS thuộc nhóm "AWS"). Chỉ hỗ trợ 2 cấp. Node cha không gắn test trực tiếp.'}
          </Form.Text>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Phương thức chấm điểm</Form.Label>
          <Form.Select
            value={formState.scoring_method}
            onChange={(event) => onChangeField('scoring_method', event.target.value)}
          >
            {scoringMethodOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
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
