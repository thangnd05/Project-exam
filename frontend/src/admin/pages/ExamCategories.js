import React, {useEffect, useMemo, useState} from 'react';
import {Badge, Button} from 'react-bootstrap';
import {Edit, Plus, Trash2} from 'lucide-react';

import {
  createExamCategory,
  deleteExamCategory,
  getExamCategories,
  updateExamCategory,
} from '../../api/examCategoryApi';
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal';
import ExamCategoryFormModal from '../modals/ExamCategoryFormModal';
import {
  AdminFieldError,
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
} from '../components/common';

const emptyForm = {
  code: '',
  name: '',
  description: '',
  guestAllowed: false,
  displayOrder: 0,
};

const mapFromApi = (item) => ({
  examCategoryId: String(item.examCategoryId),
  code: item.code || '',
  name: item.name || '',
  description: item.description || '',
  guestAllowed: !!item.guestAllowed,
  displayOrder: item.displayOrder ?? 0,
});

const buildPayload = (formState) => ({
  code: formState.code.trim(),
  name: formState.name.trim(),
  description: formState.description?.trim() || null,
  guestAllowed: !!formState.guestAllowed,
  displayOrder: Number(formState.displayOrder) || 0,
});

function ExamCategoriesManagement() {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formState, setFormState] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingItem, setDeletingItem] = useState(null);

  const filtered = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return categories;
    return categories.filter(
      (c) =>
        c.code.toLowerCase().includes(keyword) ||
        c.name.toLowerCase().includes(keyword) ||
        (c.description || '').toLowerCase().includes(keyword),
    );
  }, [categories, searchTerm]);

  const fetchAll = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const list = await getExamCategories();
      setCategories(list.map(mapFromApi));
    } catch (error) {
      setErrorMessage('Không thể tải danh sách phân loại bài thi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const resetForm = () => {
    setFormState(emptyForm);
    setEditingId(null);
    setErrorMessage('');
  };

  const openCreateModal = () => {
    resetForm();
    setShowFormModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.examCategoryId);
    setFormState({
      code: item.code,
      name: item.name,
      description: item.description || '',
      guestAllowed: !!item.guestAllowed,
      displayOrder: item.displayOrder ?? 0,
    });
    setShowFormModal(true);
  };

  const handleSubmit = async () => {
    const normalizedCode = formState.code.trim();
    const normalizedName = formState.name.trim();
    if (!normalizedCode) {
      setErrorMessage('Code không được để trống.');
      return;
    }
    if (!normalizedName) {
      setErrorMessage('Tên không được để trống.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      const payload = buildPayload(formState);
      if (editingId) {
        const updated = await updateExamCategory(editingId, payload);
        setCategories((prev) =>
          prev.map((item) =>
            item.examCategoryId === editingId ? mapFromApi(updated) : item,
          ),
        );
      } else {
        const created = await createExamCategory(payload);
        setCategories((prev) => [...prev, mapFromApi(created)]);
      }
      setShowFormModal(false);
      resetForm();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data ||
        'Không thể lưu phân loại bài thi. Vui lòng thử lại.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      await deleteExamCategory(deletingItem.examCategoryId);
      setCategories((prev) =>
        prev.filter((item) => item.examCategoryId !== deletingItem.examCategoryId),
      );
      setDeletingItem(null);
    } catch (error) {
      setErrorMessage('Không thể xóa phân loại này.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'code',
      header: 'Code',
      render: (item) => <Badge bg="primary">{item.code}</Badge>,
    },
    {key: 'name', header: 'Tên'},
    {
      key: 'guestAllowed',
      header: 'Guest',
      render: (item) =>
        item.guestAllowed ? (
          <Badge bg="success">Cho phép</Badge>
        ) : (
          <Badge bg="secondary">Không</Badge>
        ),
    },
    {key: 'displayOrder', header: 'Thứ tự'},
    {key: 'description', header: 'Mô tả', render: (item) => item.description || '-'},
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title="Phân loại bài thi"
        description="Cấu hình các loại bài thi (Quick Challenge, Full Mock, Recovery...) — gán vào Test khi tạo đề."
      >
        <Button onClick={openCreateModal}>
          <Plus size={16} className="me-1" />
          Thêm phân loại
        </Button>
      </AdminPageHeader>

      <AdminToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm theo code, tên, mô tả..."
      />
      <AdminFieldError message={errorMessage} />

      <AdminTable
        showIndex
        paginated
        itemLabel="danh mục"
        columns={columns}
        data={filtered}
        loading={loading}
        getRowKey={(item) => item.examCategoryId}
        rowActions={(item) => (
          <>
            <button onClick={() => openEditModal(item)} title="Sửa">
              <Edit size={14} />
            </button>
            <button
              className="danger"
              onClick={() => setDeletingItem(item)}
              title="Xóa"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      />

      <ExamCategoryFormModal
        show={showFormModal}
        isEditing={Boolean(editingId)}
        formState={formState}
        onChangeField={(fieldName, value) =>
          setFormState((previous) => ({...previous, [fieldName]: value}))
        }
        onClose={() => {
          if (submitting) return;
          setShowFormModal(false);
          resetForm();
        }}
        onSubmit={handleSubmit}
      />
      <ConfirmDeleteModal
        show={Boolean(deletingItem)}
        onClose={() => {
          if (submitting) return;
          setDeletingItem(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa phân loại"
        message={`Bạn có chắc muốn xóa "${deletingItem?.name || ''}" không?`}
      />
    </div>
  );
}

export default ExamCategoriesManagement;
