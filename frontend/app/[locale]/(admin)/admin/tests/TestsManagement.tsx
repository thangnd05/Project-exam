'use client';

import { useMemo, useState } from 'react';
import {Badge, Form} from 'react-bootstrap';
import {useTranslations} from 'next-intl';
import {Edit, Trash2} from 'lucide-react';

import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import {
  AdminFieldError,
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
} from '@/app/[locale]/(admin)/_components/common';
import { useAdminTests } from './_hooks/useAdminTests';
import type { CreateTestRequest, ExamTypeResponse, TestAdminResponse, UserResponse } from '@/app/types';

const parseOptionalId = (value: string) => {
  const trimmed = String(value).trim();
  return trimmed === '' ? undefined : trimmed;
};

const getUserIdValue = (user?: UserResponse) => user?.id ?? null;

const getUserDisplayName = (user?: UserResponse) => user?.fullName ?? user?.userName ?? null;

// TestAdminResponse của backend hiện chưa trả chapterId nên trường này luôn undefined
type AdminTestRow = TestAdminResponse & { chapterId?: string };

type TestFormState = {
  title: string;
  description: string;
  examTypeId: string;
  durationMinutes: number;
  maxAttempts: number;
  classId: string;
  chapterId: string;
};

const createEmptyForm = (examTypes: ExamTypeResponse[] = []): TestFormState => ({
  title: '',
  description: '',
  examTypeId: String(examTypes[0]?.examTypeId ?? ''),
  durationMinutes: 60,
  maxAttempts: 1,
  classId: '',
  chapterId: '',
});

function TestsManagement() {
  const t = useTranslations('AdminContent.tests');
  const tc = useTranslations('Common');
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
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [formState, setFormState] = useState<TestFormState>(createEmptyForm());
  const [errorMessage, setErrorMessage] = useState('');

  // Chưa chọn loại kỳ thi thì mặc định loại đầu tiên
  const formExamTypeId = formState.examTypeId || String(examTypes[0]?.examTypeId ?? '');

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
        test.title!.toLowerCase().includes(keyword) ||
        (test.description || '').toLowerCase().includes(keyword) ||
        typeName.includes(keyword)
      );
    });
  }, [tests, searchTerm, examTypes]);

  const resetForm = () => {
    setFormState(createEmptyForm(examTypes));
    setEditingTestId(null);
  };

  const openEditModal = (test: AdminTestRow) => {
    setEditingTestId(test.testId);
    setFormState({
      title: test.title!,
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

    const payload: CreateTestRequest = {
      title: normalizedTitle,
      description: formState.description.trim() || undefined,
      examTypeId: String(formExamTypeId),
      durationMinutes: Math.max(1, Number(formState.durationMinutes) || 60),
      maxAttempts: Math.max(1, Number(formState.maxAttempts) || 1),
      classId: parseOptionalId(formState.classId),
      chapterId: parseOptionalId(formState.chapterId),
    };

    setErrorMessage('');
    try {
      await updateTest({ testId: editingTestId, payload });
      setShowFormModal(false);
      resetForm();
    } catch {
      setErrorMessage(t('errors.saveFailed'));
    }
  };

  const handleDelete = async (testId: string) => {
    setErrorMessage('');
    try {
      await deleteTest(testId);
    } catch {
      setErrorMessage(t('errors.deleteFailed'));
    }
  };

  const columns = [
    {key: 'title', header: t('columns.title')},
    {
      key: 'examTypeId',
      header: t('columns.examType'),
      render: (test: AdminTestRow) => (
        <Badge bg="secondary">
          {examTypes.find(
            (item) => String(item.examTypeId) === String(test.examTypeId),
          )?.name || `ID ${test.examTypeId}`}
        </Badge>
      ),
    },
    {
      key: 'durationMinutes',
      header: t('columns.duration'),
      render: (test: AdminTestRow) =>
        test.durationMinutes != null && String(test.durationMinutes) !== ''
          ? t('minutes', {count: Number(test.durationMinutes)})
          : t('unlimited'),
    },
    {key: 'maxAttempts', header: t('columns.maxAttempts')},
    {
      key: 'classChapter',
      header: t('columns.classChapter'),
      render: (test: AdminTestRow) =>
        test.classId != null || test.chapterId != null
          ? t('classChapter', {classId: test.classId ?? '-', chapterId: test.chapterId ?? '-'})
          : '-',
    },
    {
      key: 'createdBy',
      header: t('columns.createdBy'),
      render: (test: AdminTestRow) =>
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
        title={t('title')}
        description={t('description')}
      />

      <AdminToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('searchPlaceholder')}
      />
      <AdminFieldError
        message={
          errorMessage ||
          (isError ? t('errors.loadFailed') : '')
        }
      />

      <AdminTable
        showIndex
        paginated
        itemLabel={t('itemLabel')}
        columns={columns}
        data={filteredTests}
        loading={loading}
        getRowKey={(test: AdminTestRow) => test.testId}
        rowActions={(test: AdminTestRow) => (
          <>
            <button type="button" onClick={() => openEditModal(test)} title={t('edit')}>
              <Edit size={14} />
            </button>
            <button
              type="button"
              className="danger"
              onClick={() => handleDelete(test.testId)}
              title={t('delete')}
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
        title={t('form.editTitle')}
        maxWidth={800}
        footer={
          <ModalActionFooter
            onCancel={() => {
              setShowFormModal(false);
              resetForm();
            }}
            onSubmit={handleSubmit}
            cancelLabel={tc('cancelShort')}
            submitLabel={tc('save')}
            loading={submitting || loading}
          />
        }
      >
          <Form.Group className="mb-3">
            <Form.Label>{t('columns.title')}</Form.Label>
            <Form.Control
              value={formState.title}
              onChange={(event) =>
                setFormState((previous) => ({...previous, title: event.target.value}))
              }
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>{t('form.description')}</Form.Label>
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
            <Form.Label>{t('columns.examType')}</Form.Label>
            <Form.Select
              value={formExamTypeId}
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
              <Form.Label>{t('form.duration')}</Form.Label>
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
              <Form.Label>{t('columns.maxAttempts')}</Form.Label>
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
              <Form.Label>{t('form.classId')}</Form.Label>
              <Form.Control
                type="text"
                inputMode="numeric"
                placeholder={t('form.classIdPlaceholder')}
                value={formState.classId}
                onChange={(event) =>
                  setFormState((previous) => ({...previous, classId: event.target.value}))
                }
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>{t('form.chapterId')}</Form.Label>
              <Form.Control
                type="text"
                inputMode="numeric"
                placeholder={t('form.chapterIdPlaceholder')}
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
