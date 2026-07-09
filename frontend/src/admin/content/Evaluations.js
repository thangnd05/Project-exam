import React, {useState} from 'react';
import {Badge, Button, Form} from 'react-bootstrap';
import {Edit, Plus, Trash2} from 'lucide-react';

import BaseModal from '~/shared/ui/modal/BaseModal';
import ModalActionFooter from '~/shared/ui/modal/ModalActionFooter';
import ConfirmDeleteModal from '~/shared/ui/modal/ConfirmDeleteModal';
import {
  AdminFieldError,
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
} from '../components/common';
import {useEvaluationMutations, useEvaluations} from './hooks/useEvaluations';

const emptyForm = {
  content: '',
  rating: 5,
};

function EvaluationsManagement() {
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [errorMessage, setErrorMessage] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEvaluationId, setEditingEvaluationId] = useState(null);
  const [deletingEvaluation, setDeletingEvaluation] = useState(null);
  const [formState, setFormState] = useState(emptyForm);

  const {
    evaluationList,
    totalElements,
    totalPages,
    isLoading: loading,
    isError,
  } = useEvaluations({
    page: currentPage,
    size: ITEMS_PER_PAGE,
    keyword,
    rating: ratingFilter,
  });

  const {createMutation, updateMutation, deleteMutation} =
    useEvaluationMutations();
  const submitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

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

    setErrorMessage('');
    try {
      const payload = {
        content: normalizedContent,
        rating: normalizedRating,
      };

      if (editingEvaluationId) {
        await updateMutation.mutateAsync({id: editingEvaluationId, payload});
      } else {
        await createMutation.mutateAsync(payload);
      }

      setShowFormModal(false);
      resetForm();
    } catch (error) {
      setErrorMessage('Không thể lưu đánh giá.');
    }
  };

  const handleDelete = async () => {
    if (!deletingEvaluation) {
      return;
    }

    setErrorMessage('');
    try {
      await deleteMutation.mutateAsync(deletingEvaluation.id);
      setDeletingEvaluation(null);
    } catch (error) {
      setErrorMessage('Không thể xóa đánh giá.');
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
      <AdminFieldError
        message={errorMessage || (isError ? 'Không thể tải danh sách đánh giá.' : '')}
      />

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
            submitLabel={editingEvaluationId ? 'Lưu' : 'Tạo mới'}
            loadingLabel="Đang lưu..."
            loading={submitting}
          />
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
