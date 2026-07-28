import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import classNames from 'classnames/bind';
import { getSessionReview } from '~/shared/api/learningPlanApi';
import PlanResultView from '../components/PlanResultView';
import styles from '~/features/diagnostic/styles/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

/**
 * Xem lại bài làm của MỘT lượt luyện cụ thể trong lịch sử ải
 * (khác PlanResultPage — trang đó chỉ đọc phiên nộp gần nhất).
 * taskId đi kèm query param để nút "Thử lại" / "Về lịch sử" biết đường quay lui.
 */
function PlanSessionReviewPage() {
  const { learningPlanId, sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get('taskId');
  const navigate = useNavigate();
  const [showReview, setShowReview] = useState(true);

  const query = useQuery({
    queryKey: ['plan-session-review', learningPlanId, sessionId],
    queryFn: () => getSessionReview(learningPlanId, sessionId),
    enabled: !!learningPlanId && !!sessionId,
  });

  const backTo = taskId
    ? `/learning-plans/${learningPlanId}/tasks/${taskId}/history`
    : `/learning-plans/${learningPlanId}`;

  const goToPicker = () => navigate(`/learning-plans/${learningPlanId}`);
  const retry = () =>
    navigate(
      taskId
        ? `/learning-plans/${learningPlanId}/study?taskId=${taskId}`
        : `/learning-plans/${learningPlanId}`,
    );

  if (query.isLoading) {
    return (
      <div className={cx('wrapper')}>
        <div className={cx('loading')}>Đang tải...</div>
      </div>
    );
  }

  const data = query.data;
  const loadError = query.error
    ? query.error?.response?.data?.message || query.error.message
    : null;

  if (loadError || !data?.lastReviewItems?.length) {
    return (
      <div className={cx('wrapper')}>
        <div className={cx('headerBar')}>
          <Link to={backTo} className={cx('btn', 'btnGhost', 'btnSm')}>
            ← {taskId ? 'Lịch sử ải' : 'Kế hoạch'}
          </Link>
        </div>
        <div className={cx('alert', 'alertDanger')}>
          {loadError || 'Không có bài làm nào cho lượt luyện này.'}
        </div>
      </div>
    );
  }

  const result = {
    reviewItems: data.lastReviewItems,
    passed: !!data.passed,
    accuracy: data.accuracy ?? 0,
    correctCount: data.correctCount ?? 0,
    totalCount: data.totalCount ?? 0,
    message: data.message,
  };

  return (
    <div className={cx('wrapper', 'studyWide')}>
      <div className={cx('headerBar')}>
        <Link to={backTo} className={cx('btn', 'btnGhost', 'btnSm')}>
          ← {taskId ? 'Lịch sử ải' : 'Kế hoạch'}
        </Link>
        <h2 className={cx('title')}>Bài làm của lượt luyện này</h2>
      </div>
      <PlanResultView
        result={result}
        showReview={showReview}
        onToggleReview={() => setShowReview((prev) => !prev)}
        onRetry={retry}
        onPickAnother={goToPicker}
      />
    </div>
  );
}

export default PlanSessionReviewPage;
