import React, {useCallback, useEffect, useState} from 'react';
import {Badge, Button, Form} from 'react-bootstrap';
import {Edit, Plus, Trash2} from 'lucide-react';

import {
  createEvaluation,
  deleteEvaluation,
  getEvaluations,
  updateEvaluation,
} from '../../api/evaluationApi';
import BaseModal from '~/components/common/modal/BaseModal';
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal';
import {
  AdminFieldError,
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
} from '../components/common';

const emptyForm = {
  content: '',
  rating: 5,
};

const normalizeEvaluation = (evaluation) => ({
  id: String(evaluation.id),
  content: evaluation.content || '',
  rating: Number(evaluation.rating || 0),
  created_at: evaluation.createdAt || null,
  user_id: evaluation.userId ? String(evaluation.userId) : '',
  username: evaluation.username || 'Ẩn danh',
});

function EvaluationsManagement() {
  const ITEMS_PER_PAGE = 10;
  const [evaluationList, setEvaluationList] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEvaluationId, setEditingEvaluationId] = useState(null);
  const [deletingEvaluation, setDeletingEvaluation] = useState(null);
  const [formState, setFormState] = useState(emptyForm);

  const loadEvaluations = useCallback(async (page) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const evaluationPage = await getEvaluations({
        page: Math.max(page - 1, 0),
        size: ITEMS_PER_PAGE,
        keyword,
        rating: ratingFilter,
      });
      setEvaluationList((evaluationPage.content || []).map(normalizeEvaluation));
      setTotalElements(evaluationPage.totalElements || 0);
      setTotalPages(Math.max(evaluationPage.totalPages || 1, 1));
    } catch (error) {
      setErrorMessage('Không thể tải danh sách đánh giá.');
      setEvaluationList([]);
      setTotalElements(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [keyword, ratingFilter]);

  useEffect(() => {
    loadEvaluations(currentPage);
  }, [currentPage, loadEvaluations]);

  const resetForm = () => {
    setEditingEvaluationId(null);
    setFormState(emptyForm);
  };

  const openCreateModal = () => {
    resetForm();
    setShowFormModal(true);
  };

  const openEditModal = (evaluation) => {
    setEditingEvaluationId(evaluation.id);
    setFormState({
      content: evaluation.content,
      rating: evaluation.rating,
    });
    setShowFormModal(true);
  };

  const handleSubmit = async () => {
    const normalizedContent = formState.content.trim();
    if (!normalizedContent) {
      setErrorMessage('Nội dung đánh giá không được để trống.');
      return;
    }

    const normalizedRating = Math.max(1, Math.min(5, Number(formState.rating) || 0));
    if (!normalizedRating) {
      setErrorMessage('Rating phải nằm trong khoảng 1-5.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      const payload = {
        content: normalizedContent,
        rating: normalizedRating,
      };

      if (editingEvaluationId) {
        const updatedEvaluation = await updateEvaluation(editingEvaluationId, payload);
        setEvaluationList((previous) =>
          previous.map((evaluation) =>
            evaluation.id === editingEvaluationId
              ? normalizeEvaluation(updatedEvaluation)
              : evaluation,
          ),
        );
      } else {
        const createdEvaluation = await createEvaluation(payload);
        setEvaluationList((previous) => [
          normalizeEvaluation(createdEvaluation),
          ...previous,
        ]);
      }

      setShowFormModal(false);
      resetForm();
    } catch (error) {
      setErrorMessage('Không thể lưu đánh giá.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingEvaluation) {
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      await deleteEvaluation(deletingEvaluation.id);
      setEvaluationList((previous) =>
        previous.filter((evaluation) => evaluation.id !== deletingEvaluation.id),
      );
      setDeletingEvaluation(null);
    } catch (error) {
      setErrorMessage('Không thể xóa đánh giá.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'username',
      header: 'Người dùng',
      render: (evaluation) => <div>{evaluation.username}</div>,
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (evaluation) => <Badge bg="secondary">{evaluation.rating}/5</Badge>,
    },
    {key: 'content', header: 'Nội dung', render: (evaluation) => evaluation.content},
    {
      key: 'created_at',
      header: 'Ngày tạo',
      render: (evaluation) =>
        evaluation.created_at
          ? new Date(evaluation.created_at).toLocaleString('vi-VN')
          : '-',
    },
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title="Quản lý đánh giá"
        description="Quản lý đánh giá theo CRUD, không dùng bước duyệt."
      >
        <Button onClick={openCreateModal}>
          <Plus size={16} className="me-1" />
          Thêm đánh giá
        </Button>
      </AdminPageHeader>

      <AdminToolbar
        searchValue={keyword}
        onSearchChange={(value) => {
          setKeyword(value);
          setCurrentPage(1);
        }}
        searchPlaceholder="Tìm theo nội dung hoặc người dùng..."
      >
        <Form.Select
          value={ratingFilter}
          onChange={(event) => {
            setRatingFilter(event.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="all">Tất cả rating</option>
          <option value="5">5 sao</option>
          <option value="4">4 sao</option>
          <option value="3">3 sao</option>
          <option value="2">2 sao</option>
          <option value="1">1 sao</option>
        </Form.Select>
      </AdminToolbar>
      <AdminFieldError message={errorMessage} />

      <AdminTable
        showIndex
        itemLabel="đánh giá"
        columns={columns}
        data={evaluationList}
        loading={loading}
        getRowKey={(evaluation) => evaluation.id}
        page={currentPage - 1}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={ITEMS_PER_PAGE}
        onPageChange={(p) => setCurrentPage(p + 1)}
        rowActions={(evaluation) => (
          <>
            <button onClick={() => openEditModal(evaluation)} title="Sửa đánh giá">
              <Edit size={14} />
            </button>
            <button
              className="danger"
              onClick={() => setDeletingEvaluation(evaluation)}
              title="Xóa đánh giá"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      />

      <BaseModal
        show={showFormModal}
        onClose={() => {
          if (submitting) {
            return;
          }
          setShowFormModal(false);
          resetForm();
        }}
        title={editingEvaluationId ? 'Cập nhật đánh giá' : 'Tạo đánh giá'}
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
              {editingEvaluationId ? 'Lưu' : 'Tạo mới'}
            </Button>
          </>
        }
      >
          <Form.Group className="mb-3">
            <Form.Label>Rating</Form.Label>
            <Form.Select
              value={formState.rating}
              onChange={(event) =>
                setFormState((previous) => ({
                  ...previous,
                  rating: Number(event.target.value),
                }))
              }
            >
              <option value={5}>5 sao</option>
              <option value={4}>4 sao</option>
              <option value={3}>3 sao</option>
              <option value={2}>2 sao</option>
              <option value={1}>1 sao</option>
            </Form.Select>
          </Form.Group>
          <Form.Group>
            <Form.Label>Nội dung</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={formState.content}
              onChange={(event) =>
                setFormState((previous) => ({
                  ...previous,
                  content: event.target.value,
                }))
              }
            />
          </Form.Group>
      </BaseModal>

      <ConfirmDeleteModal
        show={Boolean(deletingEvaluation)}
        onClose={() => {
          if (submitting) {
            return;
          }
          setDeletingEvaluation(null);
        }}
        onConfirm={handleDelete}
        title="Xác nhận xóa đánh giá"
        message="Bạn có chắc muốn xóa đánh giá này không?"
      />
    </div>
  );
}

export default EvaluationsManagement;
