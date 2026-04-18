import React, {useMemo, useState} from 'react';
import {Badge, Button, Form, Modal, Table} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {Edit, Plus, Search, Trash2} from 'lucide-react';

import {fakeExamParts, fakeExamTypes, fakeSkills} from '../data/fakeData';
import styles from './ExamParts.module.scss';

const cx = classNames.bind(styles);

const emptyForm = {
  exam_type_id: '',
  skill_id: '',
  name: '',
  description: '',
  default_num_questions: 1,
  has_passage: false,
};

const scoringLabelMap = {
  1: 'Có',
  0: 'Không',
};

function ExamPartsManagement() {
  const [examParts, setExamParts] = useState(fakeExamParts);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingPartId, setEditingPartId] = useState(null);
  const [formState, setFormState] = useState(emptyForm);

  const filteredExamParts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return examParts;
    }

    return examParts.filter((examPart) => {
      const examTypeName =
        fakeExamTypes.find((item) => item.exam_type_id === examPart.exam_type_id)
          ?.name || '';
      return (
        examPart.name.toLowerCase().includes(keyword) ||
        (examPart.description || '').toLowerCase().includes(keyword) ||
        examTypeName.toLowerCase().includes(keyword)
      );
    });
  }, [examParts, searchTerm]);

  const resetForm = () => {
    setEditingPartId(null);
    setFormState(emptyForm);
  };

  const openCreateModal = () => {
    resetForm();
    setShowFormModal(true);
  };

  const openEditModal = (examPart) => {
    setEditingPartId(examPart.exam_part_id);
    setFormState({
      exam_type_id: examPart.exam_type_id,
      skill_id: examPart.skill_id || '',
      name: examPart.name,
      description: examPart.description || '',
      default_num_questions: examPart.default_num_questions || 1,
      has_passage: Boolean(examPart.has_passage),
    });
    setShowFormModal(true);
  };

  const handleSubmit = () => {
    const normalizedName = formState.name.trim();
    if (!normalizedName || !formState.exam_type_id) {
      return;
    }

    const payload = {
      ...formState,
      name: normalizedName,
      exam_type_id: Number(formState.exam_type_id),
      skill_id: formState.skill_id ? Number(formState.skill_id) : null,
      default_num_questions: Number(formState.default_num_questions),
      has_passage: formState.has_passage ? 1 : 0,
    };

    if (editingPartId) {
      setExamParts((previous) =>
        previous.map((item) =>
          item.exam_part_id === editingPartId ? {...item, ...payload} : item,
        ),
      );
    } else {
      const nextId =
        examParts.reduce((maxId, item) => Math.max(maxId, item.exam_part_id), 0) +
        1;
      setExamParts((previous) => [
        ...previous,
        {exam_part_id: nextId, ...payload},
      ]);
    }

    setShowFormModal(false);
    resetForm();
  };

  const handleDelete = (examPartId) => {
    setExamParts((previous) =>
      previous.filter((item) => item.exam_part_id !== examPartId),
    );
  };

  const getExamTypeName = (examTypeId) => {
    return (
      fakeExamTypes.find((examType) => examType.exam_type_id === examTypeId)?.name ||
      'Không xác định'
    );
  };

  const getSkillName = (skillId) => {
    if (!skillId) {
      return '-';
    }
    return fakeSkills.find((skill) => skill.skill_id === skillId)?.name || '-';
  };

  return (
    <div className={cx('examPartsPage')}>
      <div className={cx('pageHeader')}>
        <div>
          <h1>Quản lý phần thi</h1>
          <p>Cấu hình các phần thi cho từng loại kỳ thi.</p>
        </div>
        <Button onClick={openCreateModal} className={cx('createBtn')}>
          <Plus size={16} />
          Thêm phần thi
        </Button>
      </div>

      <div className={cx('filterBar')}>
        <div className={cx('searchBox')}>
          <Search size={16} className={cx('searchIcon')} />
          <Form.Control
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm phần thi theo tên, mô tả, loại kỳ thi..."
          />
        </div>
      </div>

      <div className={cx('tableWrapper')}>
        <Table responsive hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên phần thi</th>
              <th>Loại kỳ thi</th>
              <th>Skill</th>
              <th>Số câu mặc định</th>
              <th>Có passage</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredExamParts.map((examPart) => (
              <tr key={examPart.exam_part_id}>
                <td>{examPart.exam_part_id}</td>
                <td>{examPart.name}</td>
                <td>{getExamTypeName(examPart.exam_type_id)}</td>
                <td>{getSkillName(examPart.skill_id)}</td>
                <td>{examPart.default_num_questions}</td>
                <td>
                  <Badge bg={examPart.has_passage ? 'success' : 'secondary'}>
                    {scoringLabelMap[examPart.has_passage]}
                  </Badge>
                </td>
                <td>
                  <div className={cx('actions')}>
                    <button onClick={() => openEditModal(examPart)} title="Sửa">
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(examPart.exam_part_id)}
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
            {editingPartId ? 'Cập nhật phần thi' : 'Tạo phần thi'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Loại kỳ thi</Form.Label>
            <Form.Select
              value={formState.exam_type_id}
              onChange={(event) =>
                setFormState((previous) => ({
                  ...previous,
                  exam_type_id: event.target.value,
                }))
              }
            >
              <option value="">Chọn loại kỳ thi</option>
              {fakeExamTypes.map((item) => (
                <option key={item.exam_type_id} value={item.exam_type_id}>
                  {item.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Tên phần thi</Form.Label>
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
            <Form.Label>Skill</Form.Label>
            <Form.Select
              value={formState.skill_id}
              onChange={(event) =>
                setFormState((previous) => ({
                  ...previous,
                  skill_id: event.target.value,
                }))
              }
            >
              <option value="">Không gán skill</option>
              {fakeSkills.map((item) => (
                <option key={item.skill_id} value={item.skill_id}>
                  {item.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Số câu mặc định</Form.Label>
            <Form.Control
              type="number"
              min={1}
              value={formState.default_num_questions}
              onChange={(event) =>
                setFormState((previous) => ({
                  ...previous,
                  default_num_questions: event.target.value,
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
          <Form.Check
            type="checkbox"
            label="Có passage"
            checked={formState.has_passage}
            onChange={(event) =>
              setFormState((previous) => ({
                ...previous,
                has_passage: event.target.checked,
              }))
            }
          />
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
            {editingPartId ? 'Lưu' : 'Tạo mới'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ExamPartsManagement;
