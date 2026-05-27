import React, {useEffect, useMemo, useState} from 'react';
import { getAdminTests, updateTest, deleteTest } from '../../api/testApi';
import { getExamTypes } from '../../api/examTypeApi';
import { getUsers } from '../../api/userApi';
import {Badge, Button, Form, Modal, Table} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {Edit, Search, Trash2} from 'lucide-react';

import styles from './Tests.module.scss';

const cx = classNames.bind(styles);

const parseOptionalId = (value) => {
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
};

const getUserIdValue = (user) => user?.id ?? user?.userId ?? user?.user_id ?? null;

const getUserDisplayName = (user) =>
  user?.fullName ?? user?.full_name ?? user?.username ?? user?.userName ?? null;

const createEmptyForm = (examTypes = []) => ({
  title: '',
  description: '',
  examTypeId: String(examTypes[0]?.examTypeId ?? ''),
  durationMinutes: 60,
  maxAttempts: 1,
  classId: '',
  chapterId: '',
});

function TestsManagement() {
  const [tests, setTests] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTestId, setEditingTestId] = useState(null);
  const [formState, setFormState] = useState(createEmptyForm());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchTests = async () => {
    const data = await getAdminTests();
    const testList = Array.isArray(data) ? data : [];
    setTests(testList);
  };

  useEffect(() => {
    const loadPageData = async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        const [testsData, examTypesData, usersData] = await Promise.all([
          getAdminTests(),
          getExamTypes(),
          getUsers({ page: 0, size: 200 }),
        ]);

        setTests(Array.isArray(testsData) ? testsData : []);
        setExamTypes(
          Array.isArray(examTypesData) ? examTypesData : [],
        );
        setUsers(
          Array.isArray(usersData?.content) ? usersData.content : [],
        );
      } catch (error) {
        setErrorMessage('Không thể tải dữ liệu đề thi từ hệ thống.');
      } finally {
        setLoading(false);
      }
    };

    loadPageData();
  }, []);

  useEffect(() => {
    if (examTypes.length > 0 && !formState.examTypeId) {
      setFormState((previous) => ({
        ...previous,
        examTypeId: String(examTypes[0].examTypeId),
      }));
    }
  }, [examTypes, formState.examTypeId]);

  const filteredTests = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return tests;
    }
    return tests.filter((test) => {
      const typeName = (
        examTypes.find(
          (item) => String(item.examTypeId) === String(test.examTypeId),
        )?.name || `ID ${test.examTypeId}`
      ).toLowerCase();
      return (
        test.title.toLowerCase().includes(keyword) ||
        (test.description || '').toLowerCase().includes(keyword) ||
        typeName.includes(keyword)
      );
    });
  }, [tests, searchTerm, examTypes]);

  const resetForm = () => {
    setFormState(createEmptyForm(examTypes));
    setEditingTestId(null);
  };

  const openEditModal = (test) => {
    setEditingTestId(test.testId);
    setFormState({
      title: test.title,
      description: test.description || '',
      examTypeId: String(test.examTypeId || ''),
      durationMinutes: test.durationMinutes || 60,
      maxAttempts: test.maxAttempts || 1,
      classId: test.classId ?? '',
      chapterId: test.chapterId ?? '',
    });
    setShowFormModal(true);
  };

  const handleSubmit = async () => {
    if (!editingTestId) {
      return;
    }

    const normalizedTitle = formState.title.trim();
    if (!normalizedTitle) {
      return;
    }

    const payload = {
      title: normalizedTitle,
      description: formState.description.trim() || null,
      examTypeId: String(formState.examTypeId),
      durationMinutes: Math.max(1, Number(formState.durationMinutes) || 60),
      maxAttempts: Math.max(1, Number(formState.maxAttempts) || 1),
      classId: parseOptionalId(formState.classId),
      chapterId: parseOptionalId(formState.chapterId),
      availableFrom: null,
      availableTo: null,
      bannerUrl: null,
    };

    setSubmitting(true);
    setErrorMessage('');
    try {
      await updateTest(editingTestId, payload);
      await fetchTests();
      setShowFormModal(false);
      resetForm();
    } catch (error) {
      setErrorMessage('Không thể lưu đề thi. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (testId) => {
    setSubmitting(true);
    setErrorMessage('');
    try {
      await deleteTest(testId);
      setTests((previous) => previous.filter((item) => item.testId !== testId));
    } catch (error) {
      setErrorMessage('Không thể xóa đề thi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={cx('testsPage')}>
      <div className={cx('pageHeader')}>
        <div>
          <h1>Quản lý đề thi</h1>
          <p>Sửa, xóa đề thi theo loại kỳ thi.</p>
        </div>
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
        {errorMessage ? <p className="text-danger mb-2">{errorMessage}</p> : null}
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
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-3">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : null}
            {filteredTests.map((test) => (
              <tr key={test.testId}>
                <td>{test.testId}</td>
                <td>{test.title}</td>
                <td>
                  <Badge bg="secondary">
                    {examTypes.find(
                      (item) => String(item.examTypeId) === String(test.examTypeId),
                    )?.name || `ID ${test.examTypeId}`}
                  </Badge>
                </td>
                <td>{test.durationMinutes} phút</td>
                <td>{test.maxAttempts}</td>
                <td>
                  {test.classId != null || test.chapterId != null
                    ? `Lớp ${test.classId ?? '—'} / Chương ${test.chapterId ?? '—'}`
                    : '—'}
                </td>
                <td>
                  {getUserDisplayName(
                    users.find(
                      (user) => String(getUserIdValue(user)) === String(test.createdBy),
                    ),
                  ) || `User #${test.createdBy || '--'}`}
                </td>
                <td>
                  <div className={cx('actions')}>
                    <button type="button" onClick={() => openEditModal(test)} title="Sửa">
                      <Edit size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(test.testId)}
                      title="Xóa"
                      disabled={submitting}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filteredTests.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-3">
                  Không có đề thi nào.
                </td>
              </tr>
            ) : null}
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
          <Modal.Title>Cập nhật đề thi</Modal.Title>
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
              value={formState.examTypeId}
              onChange={(event) =>
                setFormState((previous) => ({
                  ...previous,
                  examTypeId: event.target.value,
                }))
              }
            >
              {examTypes.map((examType) => (
                <option key={examType.examTypeId} value={examType.examTypeId}>
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
                value={formState.durationMinutes}
                onChange={(event) =>
                  setFormState((previous) => ({
                    ...previous,
                    durationMinutes: Number(event.target.value),
                  }))
                }
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Số lần làm tối đa</Form.Label>
              <Form.Control
                type="number"
                min={1}
                value={formState.maxAttempts}
                onChange={(event) =>
                  setFormState((previous) => ({
                    ...previous,
                    maxAttempts: Number(event.target.value),
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
                value={formState.classId}
                onChange={(event) =>
                  setFormState((previous) => ({...previous, classId: event.target.value}))
                }
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>ID chương (tuỳ chọn)</Form.Label>
              <Form.Control
                type="text"
                inputMode="numeric"
                placeholder="Để trống nếu không gắn chương"
                value={formState.chapterId}
                onChange={(event) =>
                  setFormState((previous) => ({
                    ...previous,
                    chapterId: event.target.value,
                  }))
                }
              />
            </Form.Group>
          </div>
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
          <Button onClick={handleSubmit} disabled={submitting || loading}>
            Lưu
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default TestsManagement;
