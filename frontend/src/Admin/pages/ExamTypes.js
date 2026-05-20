import React, {useEffect, useMemo, useState} from 'react';
import {Badge, Button, Form, Spinner, Table} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {Edit, Plus, Search, Trash2} from 'lucide-react';

import {
  createExamType,
  deleteExamType,
  getExamTypes,
  updateExamType,
} from '../../api/examTypeApi';
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal';
import ExamTypeFormModal from '../../components/modals/ExamTypeFormModal';
import styles from './ExamTypes.module.scss';

const cx = classNames.bind(styles);

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

      {errorMessage && <p className={cx('errorText')}>{errorMessage}</p>}

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
            {loading && (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  <Spinner size="sm" className="me-2" />
                  Đang tải dữ liệu...
                </td>
              </tr>
            )}
            {!loading &&
              filteredExamTypes.map((examType) => (
              <tr key={examType.exam_type_id}>
                <td>{examType.exam_type_id}</td>
                <td>{examType.name}</td>
                <td>
                  {examType.duration_minutes !== '' && examType.duration_minutes != null
                    ? `${examType.duration_minutes} phút`
                    : '-'}
                </td>
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
                      onClick={() => setDeletingExamType(examType)}
                      title="Xóa"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
              ))}
            {!loading && filteredExamTypes.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  Không có dữ liệu.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

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
