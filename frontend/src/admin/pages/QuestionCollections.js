import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Badge, Button, Form, Spinner, Table} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {Edit, Plus, Search, Trash2} from 'lucide-react';

import BaseModal from '~/components/common/modal/BaseModal';
import {
  createQuestionCollection,
  deleteQuestionCollection,
  getQuestionCollections,
  updateQuestionCollection,
} from '../../api/questionCollectionApi';
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal';
import styles from './Skills.module.scss';

const cx = classNames.bind(styles);

const defaultFormState = {
  name: '',
  description: '',
};

const mapCollectionFromApi = (collection) => ({
  collection_id: String(collection.collectionId),
  name: collection.name || '',
  description: collection.description || '',
  question_count: typeof collection.questionCount === 'number' ? collection.questionCount : 0,
});

const extractApiErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;

function QuestionCollectionsManagement() {
  const [collectionList, setCollectionList] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formState, setFormState] = useState(defaultFormState);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);

  const loadCollections = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await getQuestionCollections();
      setCollectionList(data.map(mapCollectionFromApi));
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error, 'Không thể tải danh sách bộ sưu tập.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  const filteredCollections = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) return collectionList;
    return collectionList.filter(
      (c) =>
        c.name.toLowerCase().includes(normalizedKeyword) ||
        (c.description || '').toLowerCase().includes(normalizedKeyword),
    );
  }, [collectionList, keyword]);

  const resetForm = () => {
    setFormState(defaultFormState);
    setEditingId(null);
    setErrorMessage('');
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (collection) => {
    setEditingId(collection.collection_id);
    setFormState({
      name: collection.name,
      description: collection.description || '',
    });
    setErrorMessage('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const normalizedName = formState.name.trim();
    if (!normalizedName) {
      setErrorMessage('Tên bộ sưu tập không được để trống.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      const payload = {
        name: normalizedName,
        description: formState.description.trim(),
      };

      if (editingId) {
        const updated = await updateQuestionCollection(editingId, payload);
        setCollectionList((prev) =>
          prev.map((c) => (c.collection_id === editingId ? mapCollectionFromApi(updated) : c)),
        );
      } else {
        const created = await createQuestionCollection(payload);
        setCollectionList((prev) => [...prev, mapCollectionFromApi(created)]);
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error, 'Không thể lưu bộ sưu tập.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      await deleteQuestionCollection(deletingItem.collection_id);
      setCollectionList((prev) => prev.filter((c) => c.collection_id !== deletingItem.collection_id));
      setDeletingItem(null);
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error, 'Không thể xoá bộ sưu tập.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={cx('skillsPage')}>
      <div className={cx('pageHeader')}>
        <div>
          <h1>Quản lý bộ sưu tập câu hỏi</h1>
          <p>Gom nhóm câu hỏi theo chủ đề/nguồn để dễ lọc khi tạo đề.</p>
        </div>
        <Button className={cx('createButton')} onClick={openCreateModal}>
          <Plus size={16} />
          Thêm bộ sưu tập
        </Button>
      </div>

      <div className={cx('searchContainer')}>
        <Search size={16} className={cx('searchIcon')} />
        <Form.Control
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Tìm theo tên bộ sưu tập hoặc mô tả..."
        />
      </div>
      {errorMessage && <p className={cx('errorText')}>{errorMessage}</p>}

      <div className={cx('tableWrapper')}>
        <Table responsive hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên</th>
              <th>Mô tả</th>
              <th>Số câu hỏi</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="text-center py-4">
                  <Spinner size="sm" className="me-2" />
                  Đang tải dữ liệu...
                </td>
              </tr>
            )}
            {!loading &&
              filteredCollections.map((collection) => (
                <tr key={collection.collection_id}>
                  <td>{collection.collection_id}</td>
                  <td>{collection.name}</td>
                  <td>{collection.description || '-'}</td>
                  <td>
                    <Badge bg={collection.question_count > 0 ? 'primary' : 'secondary'}>
                      {collection.question_count}
                    </Badge>
                  </td>
                  <td>
                    <div className={cx('actionButtons')}>
                      <button title="Sửa" onClick={() => openEditModal(collection)}>
                        <Edit size={14} />
                      </button>
                      <button title="Xóa" onClick={() => setDeletingItem(collection)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && filteredCollections.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4">
                  Không có dữ liệu.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      <BaseModal
        show={showModal}
        onClose={() => {
          if (submitting) return;
          setShowModal(false);
          resetForm();
        }}
        title={editingId ? 'Cập nhật bộ sưu tập' : 'Tạo bộ sưu tập'}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                if (submitting) return;
                setShowModal(false);
                resetForm();
              }}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Đang lưu...
                </>
              ) : editingId ? (
                'Lưu'
              ) : (
                'Tạo mới'
              )}
            </Button>
          </>
        }
      >
          <Form.Group className="mb-3">
            <Form.Label>Tên bộ sưu tập</Form.Label>
            <Form.Control
              value={formState.name}
              onChange={(event) =>
                setFormState((prev) => ({...prev, name: event.target.value}))
              }
              placeholder="VD: Đề thi Cambridge 16, Toeic Practice Test 1..."
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Mô tả</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formState.description}
              onChange={(event) =>
                setFormState((prev) => ({...prev, description: event.target.value}))
              }
              placeholder="Mô tả ngắn về bộ sưu tập (tùy chọn)"
            />
          </Form.Group>
          {errorMessage && <p className={cx('errorText')}>{errorMessage}</p>}
      </BaseModal>
      <ConfirmDeleteModal
        show={Boolean(deletingItem)}
        onClose={() => {
          if (submitting) return;
          setDeletingItem(null);
        }}
        onConfirm={handleDelete}
        title="Xác nhận xóa bộ sưu tập"
        message={
          deletingItem?.question_count > 0
            ? `Bộ sưu tập "${deletingItem?.name}" đang chứa ${deletingItem.question_count} câu hỏi — backend sẽ chặn xoá. Hãy bỏ liên kết các câu hỏi trước.`
            : `Bạn có chắc muốn xóa "${deletingItem?.name || ''}" không?`
        }
      />
    </div>
  );
}

export default QuestionCollectionsManagement;
