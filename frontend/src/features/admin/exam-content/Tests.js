import { useEffect, useMemo, useState } from 'react';
import {Badge, Form} from 'react-bootstrap';
import {Edit, Trash2} from 'lucide-react';

import BaseModal from '~/shared/ui/modal/BaseModal';
import ModalActionFooter from '~/shared/ui/modal/ModalActionFooter';
import {
  AdminFieldError,
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
} from '../components/common';
import { useAdminTests } from '~/features/admin/exam-content/hooks/useAdminTests';

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
  const {
    tests,
    examTypes,
    users,
    isLoading: loading,
    isError,
    updateTest,
    deleteTest,
    isMutating: submitting,
  } = useAdminTests();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTestId, setEditingTestId] = useState(null);
  const [formState, setFormState] = useState(createEmptyForm());
  const [errorMessage, setErrorMessage] = useState('');

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

    setErrorMessage('');
    try {
      await updateTest({ testId: editingTestId, payload });
      setShowFormModal(false);
      resetForm();
    } catch (error) {
      setErrorMessage('Không thể lưu đề thi. Vui lòng thử lại.');
    }
  };

  const handleDelete = async (testId) => {
    setErrorMessage('');
    try {
      await deleteTest(testId);
    } catch (error) {
      setErrorMessage('Không thể xóa đề thi.');
    }
  };

  const columns = [
    {key: 'title', header: 'Tiêu đề'},
    {
      key: 'examTypeId',
      header: 'Loại kỳ thi',
      render: (test) => (
        <Badge bg="secondary">
          {examTypes.find(
            (item) => String(item.examTypeId) === String(test.examTypeId),
          )?.name || `ID ${test.examTypeId}`}
        </Badge>
      ),
    },
    {
      key: 'durationMinutes',
      header: 'Thời lượng',
      render: (test) =>
        test.durationMinutes != null && test.durationMinutes !== ''
          ? `${test.durationMinutes} phút`
          : 'Không giới hạn',
    },
    {key: 'maxAttempts', header: 'Số lần làm tối đa'},
    {
      key: 'classChapter',
      header: 'Lớp / chương',
      render: (test) =>
        test.classId != null || test.chapterId != null
          ? `Lớp ${test.classId ?? '—'} / Chương ${test.chapterId ?? '—'}`
          : '—',
    },
    {
      key: 'createdBy',
      header: 'Người tạo',
      render: (test) =>
        getUserDisplayName(
          users.find(
            (user) => String(getUserIdValue(user)) === String(test.createdBy),
          ),
        ) || `User #${test.createdBy || '--'}`,
    },
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title="Quản lý đề thi"
        description="Sửa, xóa đề thi theo loại kỳ thi."
      />

      <AdminToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm theo tiêu đề, mô tả, loại kỳ thi..."
      />
      <AdminFieldError
        message={
          errorMessage ||
          (isError ? 'Không thể tải dữ liệu đề thi từ hệ thống.' : '')
        }
      />

      <AdminTable
        showIndex
        paginated
        itemLabel="đề thi"
        columns={columns}
        data={filteredTests}
        loading={loading}
        getRowKey={(test) => test.testId}
        rowActions={(test) => (
          <>
            <button type="button" onClick={() => openEditModal(test)} title="Sửa">
              <Edit size={14} />
            </button>
            <button
              type="button"
              className="danger"
              onClick={() => handleDelete(test.testId)}
              title="Xóa"
              disabled={submitting}
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      />

      <BaseModal
        show={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          resetForm();
        }}
        title="Cập nhật đề thi"
        maxWidth={800}
        footer={
          <ModalActionFooter
            onCancel={() => {
              setShowFormModal(false);
              resetForm();
            }}
            onSubmit={handleSubmit}
            cancelLabel="Hủy"
            submitLabel="Lưu"
            loading={submitting || loading}
          />
        }
      >
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
      </BaseModal>
    </div>
  );
}

export default TestsManagement;
