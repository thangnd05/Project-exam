import React from 'react';
import {Button, Form, Modal} from 'react-bootstrap';

const scoringMethodOptions = ['DEFAULT', 'SCORE', 'BANDS'];

function ExamTypeFormModal({
  show,
  isEditing,
  formState,
  onChangeField,
  onClose,
  onSubmit,
}) {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{isEditing ? 'Cập nhật loại kỳ thi' : 'Tạo loại kỳ thi'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
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
          <Form.Label>Thời lượng (phút)</Form.Label>
          <Form.Control
            type="number"
            min={1}
            value={formState.duration_minutes}
            onChange={(event) =>
              onChangeField('duration_minutes', Number(event.target.value))
            }
          />
        </Form.Group>
        <Form.Group>
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

export default ExamTypeFormModal;
