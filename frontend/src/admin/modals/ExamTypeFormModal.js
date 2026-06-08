import React from 'react';
import {Button, Form} from 'react-bootstrap';
import BaseModal from '~/components/common/modal/BaseModal';

const scoringMethodOptions = ['DEFAULT', 'TOEIC_SCALE', 'IELTS_BAND'];

function ExamTypeFormModal({
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
      title={isEditing ? 'Cập nhật loại kỳ thi' : 'Tạo loại kỳ thi'}
      maxWidth={550}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={onSubmit}>{isEditing ? 'Lưu' : 'Tạo mới'}</Button>
        </>
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
    </BaseModal>
  );
}

export default ExamTypeFormModal;
