import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import classNames from 'classnames/bind';
import { getCurrentSession } from '~/shared/api/learningPlanApi';
import PlanResultView from '../components/PlanResultView';
import styles from '~/features/diagnostic/styles/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

/**
 * Trang kết quả của một ải — có URL riêng nên F5 vẫn giữ kết quả.
 * Đọc lại phiên đã nộp gần nhất của ải qua current-session?includeReview=true.
 */
function PlanResultPage() {
  const { learningPlanId, taskId } = useParams();
  const navigate = useNavigate();
  const [showReview, setShowReview] = useState(true);

  const query = useQuery({
    queryKey: ['plan-result', learningPlanId, taskId],
    queryFn: () => getCurrentSession(learningPlanId, taskId, true),
    enabled: !!learningPlanId && !!taskId,
  });

  const goToPicker = () => navigate(`/learning-plans/${learningPlanId}`);
  const retry = () => navigate(`/learning-plans/${learningPlanId}/study?taskId=${taskId}`);

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
          <button type="button" className={cx('btn', 'btnGhost', 'btnSm')} onClick={goToPicker}>
            ← Kế hoạch
          </button>
        </div>
        <div className={cx('alert', 'alertDanger')}>
          {loadError || 'Chưa có kết quả cho ải này.'}
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

export default PlanResultPage;
