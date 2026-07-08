import React, {useCallback, useMemo, useState} from 'react';
import {Button, Form} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {Edit, Plus, Trash2} from 'lucide-react';

import {useExamParts} from './hooks/useExamParts';
import BaseModal from '~/components/common/modal/BaseModal';
import ModalActionFooter from '../../components/common/modal/ModalActionFooter';
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal';
import {
  AdminFieldError,
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
} from '../components/common';
import styles from './ExamParts.module.scss';

const cx = classNames.bind(styles);

const emptyForm = {
  exam_type_id: '',
  skill_id: '',
  name: '',
  description: '',
  default_num_questions: 1,
  display_order: 999,
};

function ExamPartsManagement() {
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
  const [editingPartId, setEditingPartId] = useState(null);
  const [formState, setFormState] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingExamPart, setDeletingExamPart] = useState(null);

  const getExamTypeName = useCallback(
    (examTypeId) => {
      return (
        examTypes.find((examType) => examType.exam_type_id === examTypeId)?.name ||
        'Không xác định'
      );
    },
    [examTypes],
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

    const groups = new Map();
    filteredParts.forEach((examPart) => {
      if (!groups.has(examPart.exam_type_id)) {
        groups.set(examPart.exam_type_id, []);
      }
      groups.get(examPart.exam_type_id).push(examPart);
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

  const openEditModal = (examPart) => {
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
      setErrorMessage('Vui lòng nhập đầy đủ dữ liệu phần thi.');
      return;
    }

    const payload = {
      examTypeId: formState.exam_type_id,
      skillId: formState.skill_id || null,
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
    } catch (error) {
      setErrorMessage('Không thể lưu phần thi. Vui lòng thử lại.');
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
    } catch (error) {
      setErrorMessage('Không thể xóa phần thi.');
    } finally {
      setSubmitting(false);
    }
  };

  const getSkillName = (skillId) => {
    if (!skillId) {
      return '-';
    }
    return skills.find((skill) => skill.skill_id === skillId)?.name || '-';
  };

  const columns = [
    {key: 'display_order', header: 'Thứ tự', align: 'center'},
    {key: 'name', header: 'Tên phần thi'},
    {key: 'skill', header: 'Skill', render: (examPart) => getSkillName(examPart.skill_id)},
    {key: 'default_num_questions', header: 'Số câu mặc định', align: 'center'},
  ];

  const renderRowActions = (examPart) => (
    <>
      <button onClick={() => openEditModal(examPart)} title="Sửa">
        <Edit size={14} />
      </button>
      <button
        className="danger"
        onClick={() => setDeletingExamPart(examPart)}
        title="Xóa"
      >
        <Trash2 size={14} />
      </button>
    </>
  );

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title="Quản lý phần thi"
        description="Cấu hình các phần thi cho từng loại kỳ thi."
      >
        <Button onClick={openCreateModal}>
          <Plus size={16} className="me-1" />
          Thêm phần thi
        </Button>
      </AdminPageHeader>

      <AdminToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm phần thi theo tên, mô tả, loại kỳ thi..."
      >
        <Form.Select
          style={{maxWidth: 280}}
          value={examTypeFilter}
          onChange={(event) => setExamTypeFilter(event.target.value)}
          aria-label="Lọc theo loại kỳ thi"
        >
          <option value="">-- Tất cả loại kỳ thi --</option>
          {examTypes.map((item) => (
            <option key={item.exam_type_id} value={item.exam_type_id}>
              {item.name}
            </option>
          ))}
        </Form.Select>
      </AdminToolbar>
      <AdminFieldError
        message={
          errorMessage || (isError ? 'Không thể tải dữ liệu phần thi.' : '')
        }
      />

      {loading ? (
        <AdminTable
          showIndex
          columns={columns}
          data={[]}
          loading
          getRowKey={(examPart) => examPart.exam_part_id}
          rowActions={renderRowActions}
        />
      ) : groupedExamParts.length === 0 ? (
        <AdminTable
          showIndex
          columns={columns}
          data={[]}
          emptyText="Không có phần thi nào."
          getRowKey={(examPart) => examPart.exam_part_id}
          rowActions={renderRowActions}
        />
      ) : (
        <div className={cx('groupList')}>
          {groupedExamParts.map((group) => (
            <section key={group.examTypeId} className={cx('examTypeSection')}>
              <div className={cx('sectionHeader')}>
                <h3>{group.examTypeName}</h3>
                <span className={cx('sectionMeta')}>
                  {group.parts.length} phần thi
                </span>
              </div>
              <AdminTable
                showIndex
                columns={columns}
                data={group.parts}
                getRowKey={(examPart) => examPart.exam_part_id}
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
        title={editingPartId ? 'Cập nhật phần thi' : 'Tạo phần thi'}
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
            cancelLabel="Hủy"
            submitLabel={editingPartId ? 'Lưu' : 'Tạo mới'}
            loading={submitting}
          />
        }
      >
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
              {examTypes.map((item) => (
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
              {skills.map((item) => (
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
            <Form.Label>Thứ tự hiển thị</Form.Label>
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
            <Form.Text className="text-muted">
              Số càng nhỏ hiển thị càng trên (Part 1 → 1, Part 2 → 2,...).
            </Form.Text>
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
        title="Xác nhận xóa phần thi"
        message={`Bạn có chắc muốn xóa "${deletingExamPart?.name || ''}" không?`}
      />
    </div>
  );
}

export default ExamPartsManagement;
