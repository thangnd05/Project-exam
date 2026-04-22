import React, {useEffect, useState} from 'react';
import {Badge, Button, Form, Modal, Spinner, Table} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {ChevronLeft, ChevronRight, Edit, Plus, Search, Trash2} from 'lucide-react';

import {
  createEvaluation,
  deleteEvaluation,
  getEvaluations,
  updateEvaluation,
} from '../../api/evaluationApi';
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal';
import styles from './Evaluations.module.scss';

const cx = classNames.bind(styles);

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

  const loadEvaluations = async (page) => {
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
  };

  useEffect(() => {
    loadEvaluations(currentPage);
  }, [currentPage, keyword, ratingFilter]);

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

  return (
    <div className={cx('evaluationsPage')}>
      <div className={cx('pageHeader')}>
        <div>
          <h1>Quản lý đánh giá</h1>
          <p>Quản lý đánh giá theo CRUD, không dùng bước duyệt.</p>
        </div>
        <Button onClick={openCreateModal} className={cx('createBtn')}>
          <Plus size={16} />
          Thêm đánh giá
        </Button>
      </div>

      <div className={cx('filters')}>
        <div className={cx('searchContainer')}>
          <Search size={16} className={cx('searchIcon')} />
          <Form.Control
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo nội dung hoặc người dùng..."
          />
        </div>
        <Form.Select
          value={ratingFilter}
          onChange={(event) => {
            setRatingFilter(event.target.value);
            setCurrentPage(1);
          }}
          className={cx('ratingFilter')}
        >
          <option value="all">Tất cả rating</option>
          <option value="5">5 sao</option>
          <option value="4">4 sao</option>
          <option value="3">3 sao</option>
          <option value="2">2 sao</option>
          <option value="1">1 sao</option>
        </Form.Select>
      </div>

      {errorMessage && <p className={cx('errorText')}>{errorMessage}</p>}

      <div className={cx('tableWrapper')}>
        <Table responsive hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Người dùng</th>
              <th>Rating</th>
              <th>Nội dung</th>
              <th>Ngày tạo</th>
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
              evaluationList.map((evaluation) => (
                <tr key={evaluation.id}>
                  <td>{evaluation.id}</td>
                  <td>
                    <div>{evaluation.username}</div>
                  </td>
                  <td>
                    <Badge bg="secondary">{evaluation.rating}/5</Badge>
                  </td>
                  <td>{evaluation.content}</td>
                  <td>
                    {evaluation.created_at
                      ? new Date(evaluation.created_at).toLocaleString('vi-VN')
                      : '-'}
                  </td>
                  <td>
                    <div className={cx('actionButtons')}>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => openEditModal(evaluation)}
                      >
                        <Edit size={14} />
                        Sửa
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => setDeletingEvaluation(evaluation)}
                      >
                        <Trash2 size={14} />
                        Xóa
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && evaluationList.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  Không có dữ liệu.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
      <div className={cx('pagination')}>
        <span className={cx('paginationInfo')}>
          Hiển thị {totalElements === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}-
          {totalElements === 0
            ? 0
            : Math.min((currentPage - 1) * ITEMS_PER_PAGE + evaluationList.length, totalElements)}{' '}
          trong {totalElements} bản ghi
        </span>
        <div className={cx('paginationBtns')}>
          <button
            className={cx('pageBtn')}
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((previous) => previous - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span className={cx('pageNumber')}>
            {currentPage}/{totalPages}
          </span>
          <button
            className={cx('pageBtn')}
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((previous) => previous + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <Modal
        show={showFormModal}
        onHide={() => {
          if (submitting) {
            return;
          }
          setShowFormModal(false);
          resetForm();
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editingEvaluationId ? 'Cập nhật đánh giá' : 'Tạo đánh giá'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
        </Modal.Body>
        <Modal.Footer>
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
        </Modal.Footer>
      </Modal>

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
