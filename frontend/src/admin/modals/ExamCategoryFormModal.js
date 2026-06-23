import React from 'react';
import {Form} from 'react-bootstrap';
import BaseModal from '~/components/common/modal/BaseModal';
import ModalActionFooter from '~/components/common/modal/ModalActionFooter';

function ExamCategoryFormModal({
  show,
  isEditing,
  formState,
  onChangeField,
  onClose,
  onSubmit,
}) {
  return (
    <BaseModal
      show={show}
      onClose={onClose}
      title={isEditing ? 'Cập nhật phân loại bài thi' : 'Tạo phân loại bài thi'}
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
          <Form.Label>Code *</Form.Label>
          <Form.Control
            value={formState.code}
            onChange={(event) => onChangeField('code', event.target.value)}
            placeholder="VD: QUICK_CHALLENGE, FULL_MOCK..."
            disabled={isEditing}
          />
          <Form.Text className="text-muted">
            Mã định danh để code tham chiếu. Sau khi tạo không nên đổi.
          </Form.Text>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Tên hiển thị *</Form.Label>
          <Form.Control
            value={formState.name}
            onChange={(event) => onChangeField('name', event.target.value)}
            placeholder="VD: Quick Challenge"
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Mô tả</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={formState.description}
            onChange={(event) => onChangeField('description', event.target.value)}
            placeholder="Mô tả ngắn (tuỳ chọn)"
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Check
            type="switch"
            id="guest-allowed-switch"
            label="Cho phép guest làm bài (chưa đăng nhập)"
            checked={!!formState.guestAllowed}
            onChange={(event) => onChangeField('guestAllowed', event.target.checked)}
          />
          <Form.Text className="text-muted">
            Bật cho Quick Challenge (không cần đăng ký). Tắt cho Full Mock Exam.
          </Form.Text>
        </Form.Group>
        <Form.Group>
          <Form.Label>Thứ tự hiển thị</Form.Label>
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
