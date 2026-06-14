import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Button, Form} from 'react-bootstrap';
import {Edit, Plus, Trash2} from 'lucide-react';

import {createExamPart, deleteExamPart, getExamParts, updateExamPart} from '../../api/examPartApi';
import {getExamTypes} from '../../api/examTypeApi';
import {getSkills} from '../../api/skillApi';
import BaseModal from '~/components/common/modal/BaseModal';
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal';
import {
  AdminFieldError,
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
} from '../components/common';

const emptyForm = {
  exam_type_id: '',
  skill_id: '',
  name: '',
  description: '',
  default_num_questions: 1,
  display_order: 999,
};

function ExamPartsManagement() {
  const [examParts, setExamParts] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [skills, setSkills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingPartId, setEditingPartId] = useState(null);
  const [formState, setFormState] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingExamPart, setDeletingExamPart] = useState(null);

  const mapExamPartFromApi = (item) => ({
    exam_part_id: String(item.examPartId),
    exam_type_id: String(item.examTypeId),
    skill_id: item.skillId ? String(item.skillId) : null,
    name: item.name || '',
    description: item.description || '',
    default_num_questions: item.defaultNumQuestions ,
    display_order: item.displayOrder ?? 999,
  });

  const mapExamTypeFromApi = (item) => ({
    exam_type_id: String(item.examTypeId),
    name: item.name || '',
  });

  const mapSkillFromApi = (item) => ({
    skill_id: String(item.skillId),
    name: item.name || '',
  });

  const filteredExamParts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return examParts;
    }

    return examParts.filter((examPart) => {
      const examTypeName =
        examTypes.find((item) => item.exam_type_id === examPart.exam_type_id)?.name || '';
      return (
        examPart.name.toLowerCase().includes(keyword) ||
        (examPart.description || '').toLowerCase().includes(keyword) ||
        examTypeName.toLowerCase().includes(keyword)
      );
    });
  }, [examParts, examTypes, searchTerm]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [examPartData, examTypeData, skillData] = await Promise.all([
        getExamParts(),
        getExamTypes(),
        getSkills(),
      ]);
      setExamParts(examPartData.map(mapExamPartFromApi));
      setExamTypes(examTypeData.map(mapExamTypeFromApi));
      setSkills(skillData.map(mapSkillFromApi));
    } catch (error) {
      setErrorMessage('Không thể tải dữ liệu phần thi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
        const updatedPart = await updateExamPart(editingPartId, payload);
        setExamParts((previous) =>
          previous.map((item) =>
            item.exam_part_id === editingPartId ? mapExamPartFromApi(updatedPart) : item,
          ),
        );
      } else {
        const createdPart = await createExamPart(payload);
        setExamParts((previous) =>
          [...previous, mapExamPartFromApi(createdPart)].sort(
            (a, b) => (a.display_order ?? 999) - (b.display_order ?? 999),
          ),
        );
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
      await deleteExamPart(deletingExamPart.exam_part_id);
      setExamParts((previous) =>
        previous.filter((item) => item.exam_part_id !== deletingExamPart.exam_part_id),
      );
      setDeletingExamPart(null);
    } catch (error) {
      setErrorMessage('Không thể xóa phần thi.');
    } finally {
      setSubmitting(false);
    }
  };

  const getExamTypeName = (examTypeId) => {
    return (
      examTypes.find((examType) => examType.exam_type_id === examTypeId)?.name ||
      'Không xác định'
    );
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
    {
      key: 'exam_type',
      header: 'Loại kỳ thi',
      render: (examPart) => getExamTypeName(examPart.exam_type_id),
    },
    {key: 'skill', header: 'Skill', render: (examPart) => getSkillName(examPart.skill_id)},
    {key: 'default_num_questions', header: 'Số câu mặc định', align: 'center'},
  ];

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
      />
      <AdminFieldError message={errorMessage} />

      <AdminTable
        showIndex
        paginated
        itemLabel="phần thi"
        columns={columns}
        data={filteredExamParts}
        loading={loading}
        getRowKey={(examPart) => examPart.exam_part_id}
        rowActions={(examPart) => (
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
        )}
      />

      <BaseModal
        show={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          resetForm();
        }}
        title={editingPartId ? 'Cập nhật phần thi' : 'Tạo phần thi'}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                if (submitting) {
                  return;
                }
                setShowFormModal(false);
                resetForm();
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleSubmit}>
              {editingPartId ? 'Lưu' : 'Tạo mới'}
            </Button>
          </>
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
