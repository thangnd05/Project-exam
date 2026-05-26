import React, {useEffect, useMemo, useState} from 'react';
import {Badge, Button, Form, Spinner, Table} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {Edit, Plus, Search, Trash2} from 'lucide-react';

import {
  createExamCategory,
  deleteExamCategory,
  getExamCategories,
  updateExamCategory,
} from '../../api/examCategoryApi';
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal';
import ExamCategoryFormModal from '../../components/modals/ExamCategoryFormModal';
import styles from './ExamTypes.module.scss';

const cx = classNames.bind(styles);

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

  return (
    <div className={cx('examTypesPage')}>
      <div className={cx('pageHeader')}>
        <div>
          <h1>Phân loại bài thi</h1>
          <p>
            Cấu hình các loại bài thi (Quick Challenge, Full Mock, Recovery...) — gán vào
            Test khi tạo đề.
          </p>
        </div>
        <Button onClick={openCreateModal} className={cx('createBtn')}>
          <Plus size={16} />
          Thêm phân loại
        </Button>
      </div>

      <div className={cx('filterBar')}>
        <div className={cx('searchBox')}>
          <Search size={16} className={cx('searchIcon')} />
          <Form.Control
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm theo code, tên, mô tả..."
          />
        </div>
      </div>

      {errorMessage && <p className={cx('errorText')}>{errorMessage}</p>}

      <div className={cx('tableWrapper')}>
        <Table responsive hover>
          <thead>
            <tr>
              <th>Code</th>
              <th>Tên</th>
              <th>Guest</th>
              <th>Thứ tự</th>
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
              filtered.map((item) => (
                <tr key={item.examCategoryId}>
                  <td>
                    <Badge bg="primary">{item.code}</Badge>
                  </td>
                  <td>{item.name}</td>
                  <td>
                    {item.guestAllowed ? (
                      <Badge bg="success">Cho phép</Badge>
                    ) : (
                      <Badge bg="secondary">Không</Badge>
                    )}
                  </td>
                  <td>{item.displayOrder}</td>
                  <td>{item.description || '-'}</td>
                  <td>
                    <div className={cx('actions')}>
                      <button onClick={() => openEditModal(item)} title="Sửa">
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => setDeletingItem(item)}
                        title="Xóa"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  Không có dữ liệu.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

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
