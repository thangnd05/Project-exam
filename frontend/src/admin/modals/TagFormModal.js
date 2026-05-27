import React from 'react';
import {Button, Form, Modal} from 'react-bootstrap';

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
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{isEditing ? 'Cập nhật Tag' : 'Tạo Tag mới'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
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
        <Form.Group>
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
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Hủy
        </Button>
        <Button onClick={onSubmit}>{isEditing ? 'Lưu' : 'Tạo mới'}</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default TagFormModal;
