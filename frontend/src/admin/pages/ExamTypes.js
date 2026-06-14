import React, {useEffect, useMemo, useState} from 'react';
import {Badge, Button} from 'react-bootstrap';
import {Edit, Plus, Trash2} from 'lucide-react';

import {
  createExamType,
  deleteExamType,
  getExamTypes,
  updateExamType,
} from '../../api/examTypeApi';
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal';
import ExamTypeFormModal from '../modals/ExamTypeFormModal';
import {
  AdminFieldError,
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
} from '../components/common';

const emptyForm = {
  name: '',
  description: '',
  duration_minutes: '',
  scoring_method: 'DEFAULT',
};

const mapExamTypeFromApi = (item) => ({
  exam_type_id: String(item.examTypeId),
  name: item.name || '',
  description: item.description || '',
  duration_minutes: item.durationMinutes ?? '',
  scoring_method: item.scoringMethod || 'DEFAULT',
});

const buildExamTypePayload = (formState) => {
  const durationValue = String(formState.duration_minutes).trim();
  const durationMinutes = durationValue ? Number(durationValue) : null;

  return {
    name: formState.name.trim(),
    description: formState.description.trim(),
    durationMinutes,
    scoringMethod: formState.scoring_method,
  };
};

function ExamTypesManagement() {
  const [examTypes, setExamTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState(null);
  const [formState, setFormState] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingExamType, setDeletingExamType] = useState(null);

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

  const fetchExamTypes = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const examTypeList = await getExamTypes();
      setExamTypes(examTypeList.map(mapExamTypeFromApi));
    } catch (error) {
      setErrorMessage('Không thể tải danh sách loại kỳ thi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamTypes();
  }, []);

  const resetForm = () => {
    setFormState(emptyForm);
    setEditingTypeId(null);
    setErrorMessage('');
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
      duration_minutes: examType.duration_minutes ?? '',
      scoring_method: examType.scoring_method || 'DEFAULT',
    });
    setShowFormModal(true);
  };

  const handleSubmit = async () => {
    const normalizedName = formState.name.trim();
    const durationValue = String(formState.duration_minutes).trim();
    const parsedDuration = durationValue ? Number(durationValue) : null;

    if (!normalizedName) {
      setErrorMessage('Tên loại kỳ thi không được để trống.');
      return;
    }
    if (durationValue && (!Number.isFinite(parsedDuration) || parsedDuration <= 0)) {
      setErrorMessage('Thời lượng phải là số lớn hơn 0 hoặc để trống.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      const payload = buildExamTypePayload(formState);
      if (editingTypeId) {
        const updatedExamType = await updateExamType(editingTypeId, payload);
        setExamTypes((previous) =>
          previous.map((item) =>
            item.exam_type_id === editingTypeId
              ? mapExamTypeFromApi(updatedExamType)
              : item,
          ),
        );
      } else {
        const createdExamType = await createExamType(payload);
        setExamTypes((previous) => [...previous, mapExamTypeFromApi(createdExamType)]);
      }

      setShowFormModal(false);
      resetForm();
    } catch (error) {
      setErrorMessage('Không thể lưu loại kỳ thi. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingExamType) {
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      await deleteExamType(deletingExamType.exam_type_id);
      setExamTypes((previous) =>
        previous.filter((item) => item.exam_type_id !== deletingExamType.exam_type_id),
      );
      setDeletingExamType(null);
    } catch (error) {
      setErrorMessage('Không thể xóa loại kỳ thi này.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {key: 'name', header: 'Tên', render: (examType) => examType.name || '-'},
    {
      key: 'duration_minutes',
      header: 'Thời lượng',
      render: (examType) =>
        examType.duration_minutes !== '' && examType.duration_minutes != null
          ? `${examType.duration_minutes} phút`
          : '-',
    },
    {
      key: 'scoring_method',
      header: 'Chấm điểm',
      render: (examType) => <Badge bg="primary">{examType.scoring_method}</Badge>,
    },
    {
      key: 'description',
      header: 'Mô tả',
      render: (examType) => examType.description || '-',
    },
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title="Quản lý loại kỳ thi"
        description="Cấu hình loại kỳ thi dùng cho hệ thống."
      >
        <Button onClick={openCreateModal}>
          <Plus size={16} className="me-1" />
          Thêm loại kỳ thi
        </Button>
      </AdminPageHeader>

      <AdminToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm theo tên, mô tả, phương thức chấm..."
      />
      <AdminFieldError message={errorMessage} />

      <AdminTable
        showIndex
        paginated
        itemLabel="loại đề"
        columns={columns}
        data={filteredExamTypes}
        loading={loading}
        getRowKey={(examType) => examType.exam_type_id}
        rowActions={(examType) => (
          <>
            <button onClick={() => openEditModal(examType)} title="Sửa">
              <Edit size={14} />
            </button>
            <button
              className="danger"
              onClick={() => setDeletingExamType(examType)}
              title="Xóa"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      />

      <ExamTypeFormModal
        show={showFormModal}
        isEditing={Boolean(editingTypeId)}
        formState={formState}
        onChangeField={(fieldName, value) =>
          setFormState((previous) => ({...previous, [fieldName]: value}))
        }
        onClose={() => {
          if (submitting) {
            return;
          }
          setShowFormModal(false);
          resetForm();
        }}
        onSubmit={handleSubmit}
      />
      <ConfirmDeleteModal
        show={Boolean(deletingExamType)}
        onClose={() => {
          if (submitting) {
            return;
          }
          setDeletingExamType(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa loại kỳ thi"
        message={`Bạn có chắc muốn xóa "${deletingExamType?.name || ''}" không?`}
      />
    </div>
  );
}

export default ExamTypesManagement;
