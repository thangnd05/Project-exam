import { useState } from 'react';
import classNames from 'classnames/bind';
import {Alert, Spinner} from 'react-bootstrap';
import {useNavigate} from 'react-router-dom';
import { IoCalendarOutline, IoStar } from 'react-icons/io5';
import {toast} from 'react-toastify';
import ConfirmDeleteModal from '~/shared/ui/modal/ConfirmDeleteModal';
import routes from '~/shared/config/Routes';
import {useMyEvaluations} from './useMyEvaluations';
import styles from './MyEvaluationsPage.module.scss';

const cx = classNames.bind(styles);

const formatDateTime = (value) => {
  if (!value) return '--';
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return '--';
  return parsedDate.toLocaleString('vi-VN');
};

function MyEvaluationsPage({ embedded = false }) {
  const navigate = useNavigate();
  const {evaluations, isLoading: loading, isError, updateMutation, deleteMutation} =
    useMyEvaluations();
  const errorMessage = isError
    ? 'Không tải được danh sách đánh giá. Vui lòng thử lại sau.'
    : '';
  const [editingEvaluationId, setEditingEvaluationId] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editContent, setEditContent] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [deletingEvaluationId, setDeletingEvaluationId] = useState(null);

  const startEditEvaluation = (evaluation) => {
    setEditingEvaluationId(evaluation.id);
    setEditRating(Number(evaluation.rating || 0));
    setEditContent(evaluation.content || '');
  };

  const cancelEditEvaluation = () => {
    setEditingEvaluationId(null);
    setEditRating(0);
    setEditContent('');
  };

  const handleUpdateEvaluation = async (evaluationId) => {
    const trimmedContent = editContent.trim();
    if (!editRating || editRating < 1 || editRating > 5) {
      toast.error('Vui lòng chọn số sao từ 1 đến 5.');
      return;
    }
    if (!trimmedContent) {
      toast.error('Nội dung đánh giá không được để trống.');
      return;
    }

    setActionLoadingId(evaluationId);

    try {
      await updateMutation.mutateAsync({
        evaluationId,
        rating: editRating,
        content: trimmedContent,
      });
      toast.success('Cập nhật đánh giá thành công.');
      cancelEditEvaluation();
    } catch (error) {
      toast.error('Không thể cập nhật đánh giá. Vui lòng thử lại.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteEvaluation = async () => {
    if (!deletingEvaluationId) return;
    const evaluationId = deletingEvaluationId;

    setActionLoadingId(evaluationId);

    try {
      await deleteMutation.mutateAsync(evaluationId);
      if (editingEvaluationId === evaluationId) {
        cancelEditEvaluation();
      }
      toast.success('Đã xóa đánh giá thành công.');
      setDeletingEvaluationId(null);
    } catch (error) {
      toast.error('Không thể xóa đánh giá. Vui lòng thử lại.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className={cx({ wrapper: !embedded })}>
      <div className={cx({ container: !embedded })}>
        {!embedded && (
          <header className={cx('header')}>
            <div>
              <h1 className={cx('title')}>Đánh giá của tôi</h1>
              <p className={cx('subtitle')}>
                Tất cả đánh giá bạn đã gửi cho hệ thống.
              </p>
            </div>
            <button
              type="button"
              className={cx('backBtn')}
              onClick={() => navigate(routes.profile)}
            >
              Quay lại profile
            </button>
          </header>
        )}

        {loading && (
          <div className={cx('loadingWrap')}>
            <Spinner animation="border" />
            <span>Đang tải đánh giá...</span>
          </div>
        )}

        {!loading && errorMessage && (
          <Alert variant="danger" className={cx('alertBox')}>
            {errorMessage}
          </Alert>
        )}

        {!loading && !errorMessage && evaluations.length === 0 && (
          <Alert variant="info" className={cx('alertBox')}>
            Bạn chưa có đánh giá nào.
          </Alert>
        )}

        {!loading && !errorMessage && evaluations.length > 0 && (
          <div className={cx('list')}>
            {evaluations.map((evaluation) => (
              <article key={evaluation.id} className={cx('item')}>
                <div className={cx('itemHeader')}>
                  <div className={cx('stars')}>
                    {Array.from({length: 5}).map((_, index) => (
                      <IoStar
                        key={`${evaluation.id}-star-${index}`}
                        className={cx(
                          index < Number(evaluation.rating || 0)
                            ? 'starActive'
                            : 'starInactive',
                        )}
                      />
                    ))}
                  </div>
                  <span className={cx('date')}>
                    <IoCalendarOutline />
                    {formatDateTime(evaluation.createdAt)}
                  </span>
                </div>

                {editingEvaluationId === evaluation.id ? (
                  <div className={cx('editSection')}>
                    <div className={cx('ratingPicker')}>
                      {Array.from({length: 5}).map((_, index) => {
                        const starValue = index + 1;
                        return (
                          <button
                            key={`${evaluation.id}-edit-star-${starValue}`}
                            type="button"
                            className={cx('starButton')}
                            onClick={() => setEditRating(starValue)}
                            aria-label={`Đánh giá ${starValue} sao`}
                          >
                            <IoStar
                              className={cx(
                                starValue <= editRating
                                  ? 'starActive'
                                  : 'starInactive',
                              )}
                            />
                          </button>
                        );
                      })}
                    </div>

                    <textarea
                      className={cx('editTextarea')}
                      value={editContent}
                      onChange={(event) => setEditContent(event.target.value)}
                      placeholder="Nhập nội dung đánh giá..."
                      rows={4}
                    />

                    <div className={cx('actionRow')}>
                      <button
                        type="button"
                        className={cx('actionBtn', 'saveBtn')}
                        onClick={() => handleUpdateEvaluation(evaluation.id)}
                        disabled={actionLoadingId === evaluation.id}
                      >
                        {actionLoadingId === evaluation.id ? 'Đang lưu...' : 'Lưu'}
                      </button>
                      <button
                        type="button"
                        className={cx('actionBtn', 'cancelBtn')}
                        onClick={cancelEditEvaluation}
                        disabled={actionLoadingId === evaluation.id}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className={cx('content')}>{evaluation.content || '--'}</p>
                    <div className={cx('actionRow')}>
                      <button
                        type="button"
                        className={cx('actionBtn', 'editBtn')}
                        onClick={() => startEditEvaluation(evaluation)}
                        disabled={actionLoadingId === evaluation.id}
                      >
                        Sửa đánh giá
                      </button>
                      <button
                        type="button"
                        className={cx('actionBtn', 'deleteBtn')}
                        onClick={() => setDeletingEvaluationId(evaluation.id)}
                        disabled={actionLoadingId === evaluation.id}
                      >
                        {actionLoadingId === evaluation.id ? 'Đang xóa...' : 'Xóa đánh giá'}
                      </button>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        show={Boolean(deletingEvaluationId)}
        onClose={() => setDeletingEvaluationId(null)}
        onConfirm={handleDeleteEvaluation}
        title="Xác nhận xóa đánh giá"
        message="Bạn có chắc chắn muốn xóa đánh giá này không? Hành động này không thể hoàn tác."
      />
    </div>
  );
}

export default MyEvaluationsPage;
