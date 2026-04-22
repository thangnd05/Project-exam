import React, {useMemo, useState} from 'react';
import {Badge, Button, Form, Modal, Table} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {Edit, Plus, Search, Trash2} from 'lucide-react';

import {fakeExamTypes, fakeTests, fakeUsers} from '../data/fakeData';
import styles from './Tests.module.scss';

const cx = classNames.bind(styles);

const parseOptionalId = (value) => {
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
};

const emptyForm = {
  title: '',
  description: '',
  exam_type_id: String(fakeExamTypes[0]?.exam_type_id ?? ''),
  duration_minutes: 60,
  max_attempts: 1,
  class_id: '',
  chapter_id: '',
  created_by: String(fakeUsers[0]?.user_id ?? ''),
};

const getExamTypeName = (examTypeId) => {
  const found = fakeExamTypes.find(
    (item) => String(item.exam_type_id) === String(examTypeId),
  );
  return found?.name ?? `ID ${examTypeId}`;
};

const getCreatorName = (userId) => {
  const found = fakeUsers.find((user) => String(user.user_id) === String(userId));
  return found?.full_name ?? `User #${userId}`;
};

function TestsManagement() {
  const [tests, setTests] = useState(fakeTests);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTestId, setEditingTestId] = useState(null);
  const [formState, setFormState] = useState(emptyForm);

  const filteredTests = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return tests;
    }
    return tests.filter((test) => {
      const typeName = getExamTypeName(test.exam_type_id).toLowerCase();
      return (
        test.title.toLowerCase().includes(keyword) ||
        (test.description || '').toLowerCase().includes(keyword) ||
        typeName.includes(keyword)
      );
    });
  }, [tests, searchTerm]);

  const resetForm = () => {
    setFormState(emptyForm);
    setEditingTestId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowFormModal(true);
  };

  const openEditModal = (test) => {
    setEditingTestId(test.test_id);
    setFormState({
      title: test.title,
      description: test.description || '',
      exam_type_id: test.exam_type_id,
      duration_minutes: test.duration_minutes,
      max_attempts: test.max_attempts,
      class_id: test.class_id ?? '',
      chapter_id: test.chapter_id ?? '',
      created_by: test.created_by,
    });
    setShowFormModal(true);
  };

  const handleSubmit = () => {
    const normalizedTitle = formState.title.trim();
    if (!normalizedTitle) {
      return;
    }

    const classId = parseOptionalId(formState.class_id);
    const chapterId = parseOptionalId(formState.chapter_id);
    const duration = Math.max(1, Number(formState.duration_minutes) || 60);
    const maxAttempts = Math.max(1, Number(formState.max_attempts) || 1);

    if (editingTestId) {
      setTests((previous) =>
        previous.map((item) =>
          item.test_id === editingTestId
            ? {
                ...item,
                title: normalizedTitle,
                description: formState.description.trim() || null,
                exam_type_id: String(formState.exam_type_id),
                duration_minutes: duration,
                max_attempts: maxAttempts,
                class_id: classId,
                chapter_id: chapterId,
                created_by: String(formState.created_by),
              }
            : item,
        ),
      );
    } else {
      const nextId =
        tests.reduce((maxId, item) => Math.max(maxId, item.test_id), 0) + 1;
      const today = new Date().toISOString().slice(0, 10);
      setTests((previous) => [
        ...previous,
        {
          test_id: nextId,
          title: normalizedTitle,
          description: formState.description.trim() || null,
          exam_type_id: String(formState.exam_type_id),
          duration_minutes: duration,
          max_attempts: maxAttempts,
          class_id: classId,
          chapter_id: chapterId,
          created_by: String(formState.created_by),
          created_at: today,
        },
      ]);
    }

    setShowFormModal(false);
    resetForm();
  };

  const handleDelete = (testId) => {
    setTests((previous) => previous.filter((item) => item.test_id !== testId));
  };

  return (
    <div className={cx('testsPage')}>
      <div className={cx('pageHeader')}>
        <div>
          <h1>Quản lý đề thi</h1>
          <p>Tạo, sửa, xóa đề thi theo loại kỳ thi (dữ liệu demo trên trình duyệt).</p>
        </div>
        <Button onClick={openCreateModal} className={cx('createBtn')}>
          <Plus size={16} />
          Thêm đề thi
        </Button>
      </div>

      <div className={cx('filterBar')}>
        <div className={cx('searchBox')}>
          <Search size={16} className={cx('searchIcon')} />
          <Form.Control
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm theo tiêu đề, mô tả, loại kỳ thi..."
          />
        </div>
      </div>

      <div className={cx('tableWrapper')}>
        <Table responsive hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tiêu đề</th>
              <th>Loại kỳ thi</th>
              <th>Thời lượng</th>
              <th>Số lần làm tối đa</th>
              <th>Lớp / chương</th>
              <th>Người tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredTests.map((test) => (
              <tr key={test.test_id}>
                <td>{test.test_id}</td>
                <td>{test.title}</td>
                <td>
                  <Badge bg="secondary">{getExamTypeName(test.exam_type_id)}</Badge>
                </td>
                <td>{test.duration_minutes} phút</td>
                <td>{test.max_attempts}</td>
                <td>
                  {test.class_id != null || test.chapter_id != null
                    ? `Lớp ${test.class_id ?? '—'} / Chương ${test.chapter_id ?? '—'}`
                    : '—'}
                </td>
                <td>{getCreatorName(test.created_by)}</td>
                <td>
                  <div className={cx('actions')}>
                    <button type="button" onClick={() => openEditModal(test)} title="Sửa">
                      <Edit size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(test.test_id)}
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
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>{editingTestId ? 'Cập nhật đề thi' : 'Tạo đề thi'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Tiêu đề</Form.Label>
            <Form.Control
              value={formState.title}
              onChange={(event) =>
                setFormState((previous) => ({...previous, title: event.target.value}))
              }
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Mô tả</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
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
              {fakeExamTypes.map((examType) => (
                <option key={examType.exam_type_id} value={examType.exam_type_id}>
                  {examType.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <div className="row">
            <Form.Group className="mb-3 col-md-6">
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
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Số lần làm tối đa</Form.Label>
              <Form.Control
                type="number"
                min={1}
                value={formState.max_attempts}
                onChange={(event) =>
                  setFormState((previous) => ({
                    ...previous,
                    max_attempts: Number(event.target.value),
                  }))
                }
              />
            </Form.Group>
          </div>
          <div className="row">
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>ID lớp (tuỳ chọn)</Form.Label>
              <Form.Control
                type="text"
                inputMode="numeric"
                placeholder="Để trống nếu không gắn lớp"
                value={formState.class_id}
                onChange={(event) =>
                  setFormState((previous) => ({...previous, class_id: event.target.value}))
                }
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>ID chương (tuỳ chọn)</Form.Label>
              <Form.Control
                type="text"
                inputMode="numeric"
                placeholder="Để trống nếu không gắn chương"
                value={formState.chapter_id}
                onChange={(event) =>
                  setFormState((previous) => ({
                    ...previous,
                    chapter_id: event.target.value,
                  }))
                }
              />
            </Form.Group>
          </div>
          <Form.Group>
            <Form.Label>Người tạo</Form.Label>
            <Form.Select
              value={formState.created_by}
              onChange={(event) =>
                setFormState((previous) => ({
                  ...previous,
                  created_by: event.target.value,
                }))
              }
            >
              {fakeUsers.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {user.full_name} ({user.user_name})
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
          <Button onClick={handleSubmit}>{editingTestId ? 'Lưu' : 'Tạo mới'}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default TestsManagement;
