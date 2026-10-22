'use client';

import { useCallback, useMemo, useState } from 'react';
import {Button, Form} from 'react-bootstrap';
import {useTranslations} from 'next-intl';
import classNames from 'classnames/bind';
import {Edit, Plus, Trash2} from 'lucide-react';

import {useExamParts, type ExamPartItem} from './_hooks/useExamParts';
import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import {
  AdminFieldError,
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
} from '@/app/[locale]/(admin)/_components/common';
import type {ExamPartRequest} from '@/app/types';
import styles from './ExamPartsManagement.module.scss';

const cx = classNames.bind(styles);

type ExamPartFormState = {
  exam_type_id: string;
  skill_id: string;
  name: string;
  description: string;
  default_num_questions: number | string;
  display_order: number | string;
};

const emptyForm: ExamPartFormState = {
  exam_type_id: '',
  skill_id: '',
  name: '',
  description: '',
  default_num_questions: 1,
  display_order: 999,
};

function ExamPartsManagement() {
  const t = useTranslations('AdminContent.examParts');
  const tc = useTranslations('Common');
  const {
    examParts,
    examTypes,
    skills,
    isLoading: loading,
    isError,
    createMutation,
    updateMutation,
    deleteMutation,
  } = useExamParts();
  const [searchTerm, setSearchTerm] = useState('');
  const [examTypeFilter, setExamTypeFilter] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [formState, setFormState] = useState<ExamPartFormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingExamPart, setDeletingExamPart] = useState<ExamPartItem | null>(null);

  const getExamTypeName = useCallback(
    (examTypeId: string) => {
      return (
        examTypes.find((examType) => examType.exam_type_id === examTypeId)?.name ||
        t('unknownExamType')
      );
    },
    [examTypes, t],
  );

  const groupedExamParts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    const scopedParts = examTypeFilter
      ? examParts.filter((examPart) => examPart.exam_type_id === examTypeFilter)
      : examParts;
    const filteredParts = keyword
      ? scopedParts.filter((examPart) => {
          const examTypeName = getExamTypeName(examPart.exam_type_id);
          return (
            examPart.name.toLowerCase().includes(keyword) ||
            (examPart.description || '').toLowerCase().includes(keyword) ||
            examTypeName.toLowerCase().includes(keyword)
          );
        })
      : scopedParts;

    const groups = new Map<string, ExamPartItem[]>();
    filteredParts.forEach((examPart) => {
      if (!groups.has(examPart.exam_type_id)) {
        groups.set(examPart.exam_type_id, []);
      }
      groups.get(examPart.exam_type_id)!.push(examPart);
    });

    return [...groups.entries()]
      .map(([examTypeId, parts]) => ({
        examTypeId,
        examTypeName: getExamTypeName(examTypeId),
        parts: [...parts].sort((left, right) => {
          const orderCompare =
            (left.display_order ?? 999) - (right.display_order ?? 999);
          if (orderCompare !== 0) {
            return orderCompare;
          }
          return left.name.localeCompare(right.name, 'vi');
        }),
      }))
      .sort((left, right) => left.examTypeName.localeCompare(right.examTypeName, 'vi'));
  }, [examParts, getExamTypeName, searchTerm, examTypeFilter]);

  const resetForm = () => {
    setEditingPartId(null);
    setFormState(emptyForm);
  };

  const openCreateModal = () => {
    resetForm();

    if (examTypeFilter) {
      setFormState((previous) => ({ ...previous, exam_type_id: examTypeFilter }));
    }
    setShowFormModal(true);
  };

  const openEditModal = (examPart: ExamPartItem) => {
    setEditingPartId(examPart.exam_part_id);
    setFormState({
      exam_type_id: examPart.exam_type_id,
      skill_id: examPart.skill_id || '',
      name: examPart.name,
      description: examPart.description || '',
      default_num_questions: examPart.default_num_questions || 1,
      display_order: examPart.display_order ?? 999,
    });
    setShowFormModal(true);
  };

  const handleSubmit = async () => {
    const normalizedName = formState.name.trim();
    if (!normalizedName || !formState.exam_type_id) {
      setErrorMessage(t('errors.required'));
      return;
    }

    const payload: ExamPartRequest = {
      examTypeId: formState.exam_type_id,
      skillId: formState.skill_id || undefined,
      name: normalizedName,
      description: formState.description.trim(),
      defaultNumQuestions: Number(formState.default_num_questions),
      displayOrder: Number(formState.display_order) || 999,
    };

    setSubmitting(true);
    setErrorMessage('');
    try {
      if (editingPartId) {
        await updateMutation.mutateAsync({ id: editingPartId, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setShowFormModal(false);
      resetForm();
    } catch {
      setErrorMessage(t('errors.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingExamPart) {
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      await deleteMutation.mutateAsync(deletingExamPart.exam_part_id);
      setDeletingExamPart(null);
    } catch {
      setErrorMessage(t('errors.deleteFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const getSkillName = (skillId: string | null) => {
    if (!skillId) {
      return '-';
    }
    return skills.find((skill) => skill.skill_id === skillId)?.name || '-';
  };

  const columns = [
    {key: 'display_order', header: t('columns.order'), align: 'center'},
    {key: 'name', header: t('columns.name')},
    {key: 'skill', header: 'Skill', render: (examPart: ExamPartItem) => getSkillName(examPart.skill_id)},
    {key: 'default_num_questions', header: t('columns.defaultNumQuestions'), align: 'center'},
  ];

  const renderRowActions = (examPart: ExamPartItem) => (
    <>
      <button onClick={() => openEditModal(examPart)} title={t('edit')}>
        <Edit size={14} />
      </button>
      <button
        className="danger"
        onClick={() => setDeletingExamPart(examPart)}
        title={t('delete')}
      >
        <Trash2 size={14} />
      </button>
    </>
  );

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title={t('title')}
        description={t('description')}
      >
        <Button onClick={openCreateModal}>
          <Plus size={16} className="me-1" />
          {t('add')}
        </Button>
      </AdminPageHeader>

      <AdminToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('searchPlaceholder')}
      >
        <Form.Select
          style={{maxWidth: 280}}
          value={examTypeFilter}
          onChange={(event) => setExamTypeFilter(event.target.value)}
          aria-label={t('filterByExamType')}
        >
          <option value="">{t('allExamTypes')}</option>
          {examTypes.map((item) => (
            <option key={item.exam_type_id} value={item.exam_type_id}>
              {item.name}
            </option>
          ))}
        </Form.Select>
      </AdminToolbar>
      <AdminFieldError
        message={
          errorMessage || (isError ? t('errors.loadFailed') : '')
        }
      />

      {loading ? (
        <AdminTable
          showIndex
          columns={columns}
          data={[]}
          loading
          getRowKey={(examPart: ExamPartItem) => examPart.exam_part_id}
          rowActions={renderRowActions}
        />
      ) : groupedExamParts.length === 0 ? (
        <AdminTable
          showIndex
          columns={columns}
          data={[]}
          emptyText={t('empty')}
          getRowKey={(examPart: ExamPartItem) => examPart.exam_part_id}
          rowActions={renderRowActions}
        />
      ) : (
        <div className={cx('groupList')}>
          {groupedExamParts.map((group) => (
            <section key={group.examTypeId} className={cx('examTypeSection')}>
              <div className={cx('sectionHeader')}>
                <h3>{group.examTypeName}</h3>
                <span className={cx('sectionMeta')}>
                  {t('partCount', {count: group.parts.length})}
                </span>
              </div>
              <AdminTable
                showIndex
                columns={columns}
                data={group.parts}
                getRowKey={(examPart: ExamPartItem) => examPart.exam_part_id}
                rowActions={renderRowActions}
              />
            </section>
          ))}
        </div>
      )}

      <BaseModal
        show={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          resetForm();
        }}
        title={editingPartId ? t('editTitle') : t('createTitle')}
        footer={
          <ModalActionFooter
            onCancel={() => {
              if (submitting) {
                return;
              }
              setShowFormModal(false);
              resetForm();
            }}
            onSubmit={handleSubmit}
            cancelLabel={tc('cancelShort')}
            submitLabel={editingPartId ? tc('save') : t('create')}
            loading={submitting}
          />
        }
      >
          <Form.Group className="mb-3">
            <Form.Label>{t('form.examType')}</Form.Label>
            <Form.Select
              value={formState.exam_type_id}
              onChange={(event) =>
                setFormState((previous) => ({
                  ...previous,
                  exam_type_id: event.target.value,
                }))
              }
            >
              <option value="">{t('form.examTypePlaceholder')}</option>
              {examTypes.map((item) => (
                <option key={item.exam_type_id} value={item.exam_type_id}>
                  {item.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>{t('columns.name')}</Form.Label>
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
              <option value="">{t('form.noSkill')}</option>
              {skills.map((item) => (
                <option key={item.skill_id} value={item.skill_id}>
                  {item.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>{t('columns.defaultNumQuestions')}</Form.Label>
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
            <Form.Label>{t('form.displayOrder')}</Form.Label>
            <Form.Control
              type="number"
              min={1}
              value={formState.display_order}
              onChange={(event) =>
                setFormState((previous) => ({
                  ...previous,
                  display_order: event.target.value,
                }))
              }
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>{t('form.description')}</Form.Label>
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
      </BaseModal>
      <ConfirmDeleteModal
        show={Boolean(deletingExamPart)}
        onClose={() => {
          if (submitting) {
            return;
          }
          setDeletingExamPart(null);
        }}
        onConfirm={handleDelete}
        title={t('deleteTitle')}
        message={t('deleteMessage', {name: deletingExamPart?.name || ''})}
      />
    </div>
  );
}

export default ExamPartsManagement;
