import React, {useMemo, useState} from 'react';
import {Badge, Button, Form, Modal, Table} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {Edit, Plus, Search, Trash2} from 'lucide-react';

import {fakeExamTypes} from '../data/fakeData';
import styles from './ExamTypes.module.scss';

const cx = classNames.bind(styles);

const scoringMethodOptions = ['DEFAULT', 'SCORE', 'BANDS'];

const emptyForm = {
  name: '',
  description: '',
  duration_minutes: 60,
  scoring_method: 'DEFAULT',
};

function ExamTypesManagement() {
  const [examTypes, setExamTypes] = useState(fakeExamTypes);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState(null);
  const [formState, setFormState] = useState(emptyForm);

  const filteredExamTypes = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return examTypes;
    }
    return examTypes.filter((examType) => {
      return (
        examType.name.toLowerCase().includes(keyword) ||
        (examType.description || '').toLowerCase().includes(keyword) ||
        examType.scoring_method.toLowerCase().includes(keyword)
      );
    });
  }, [examTypes, searchTerm]);

  const resetForm = () => {
    setFormState(emptyForm);
    setEditingTypeId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowFormModal(true);
  };

  const openEditModal = (examType) => {
    setEditingTypeId(examType.exam_type_id);
    setFormState({
      name: examType.name,
      description: examType.description || '',
      duration_minutes: examType.duration_minutes || 60,
      scoring_method: examType.scoring_method || 'DEFAULT',
    });
    setShowFormModal(true);
  };

  const handleSubmit = () => {
    const normalizedName = formState.name.trim();
    if (!normalizedName) {
      return;
    }

    if (editingTypeId) {
      setExamTypes((previous) =>
        previous.map((item) =>
          item.exam_type_id === editingTypeId
            ? {
                ...item,
                ...formState,
                name: normalizedName,
              }
            : item,
        ),
      );
    } else {
      const nextId =
        examTypes.reduce((maxId, item) => Math.max(maxId, item.exam_type_id), 0) +
        1;
      setExamTypes((previous) => [
        ...previous,
        {
          exam_type_id: nextId,
          ...formState,
          name: normalizedName,
        },
      ]);
    }

    setShowFormModal(false);
    resetForm();
  };

  const handleDelete = (examTypeId) => {
    setExamTypes((previous) =>
      previous.filter((item) => item.exam_type_id !== examTypeId),
    );
  };

  return (
    <div className={cx('examTypesPage')}>
      <div className={cx('pageHeader')}>
        <div>
          <h1>Quản lý loại kỳ thi</h1>
          <p>Cấu hình loại kỳ thi dùng cho hệ thống.</p>
        </div>
        <Button onClick={openCreateModal} className={cx('createBtn')}>
          <Plus size={16} />
          Thêm loại kỳ thi
        </Button>
      </div>

      <div className={cx('filterBar')}>
        <div className={cx('searchBox')}>
          <Search size={16} className={cx('searchIcon')} />
          <Form.Control
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm theo tên, mô tả, phương thức chấm..."
          />
        </div>
      </div>

      <div className={cx('tableWrapper')}>
        <Table responsive hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên</th>
              <th>Thời lượng</th>
              <th>Chấm điểm</th>
              <th>Mô tả</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredExamTypes.map((examType) => (
              <tr key={examType.exam_type_id}>
                <td>{examType.exam_type_id}</td>
                <td>{examType.name}</td>
                <td>{examType.duration_minutes} phút</td>
                <td>
                  <Badge bg="primary">{examType.scoring_method}</Badge>
                </td>
                <td>{examType.description || '-'}</td>
                <td>
                  <div className={cx('actions')}>
                    <button onClick={() => openEditModal(examType)} title="Sửa">
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(examType.exam_type_id)}
                      title="Xóa"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <Modal
        show={showFormModal}
        onHide={() => {
          setShowFormModal(false);
          resetForm();
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editingTypeId ? 'Cập nhật loại kỳ thi' : 'Tạo loại kỳ thi'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Tên</Form.Label>
            <Form.Control
              value={formState.name}
              onChange={(event) =>
                setFormState((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Mô tả</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formState.description}
              onChange={(event) =>
                setFormState((previous) => ({
                  ...previous,
                  description: event.target.value,
                }))
              }
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Thời lượng (phút)</Form.Label>
            <Form.Control
              type="number"
              min={1}
              value={formState.duration_minutes}
              onChange={(event) =>
                setFormState((previous) => ({
                  ...previous,
                  duration_minutes: Number(event.target.value),
                }))
              }
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Phương thức chấm điểm</Form.Label>
            <Form.Select
              value={formState.scoring_method}
              onChange={(event) =>
                setFormState((previous) => ({
                  ...previous,
                  scoring_method: event.target.value,
                }))
              }
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
          <Button
            variant="secondary"
            onClick={() => {
              setShowFormModal(false);
              resetForm();
            }}
          >
            Hủy
          </Button>
          <Button onClick={handleSubmit}>
            {editingTypeId ? 'Lưu' : 'Tạo mới'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ExamTypesManagement;
