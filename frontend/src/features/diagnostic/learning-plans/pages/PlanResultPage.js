import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import PlanCongratsModal, { markCongratsSeen } from '../components/PlanCongratsModal';
import PlanResultView from '../components/PlanResultView';
import { toPlanResult } from '../planResult';
import { usePlanResult } from '../hooks/usePlanResult';
import styles from '~/features/diagnostic/styles/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

function PlanResultPage() {
  const { learningPlanId, taskId } = useParams();
  const navigate = useNavigate();
  const [showCongrats, setShowCongrats] = useState(false);

  const query = usePlanResult(learningPlanId, taskId);

  const goToPicker = () => navigate(`/learning-plans/${learningPlanId}`);
  const retry = () => navigate(`/learning-plans/${learningPlanId}/study?taskId=${taskId}`);

  // Vượt ải cuối → toàn bộ lộ trình đã xong: bật modal chúc mừng
  // và đánh dấu đã xem để trang kế hoạch không hiện lại lần nữa.
  const allTasksDone = !!query.data?.passed && query.data?.planStage === 'MOCK';
  useEffect(() => {
    if (!allTasksDone) return;
    setShowCongrats(true);
    markCongratsSeen(learningPlanId);
  }, [allTasksDone, learningPlanId]);

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

  const result = toPlanResult(data);

  return (
    <div className={cx('wrapper', 'studyWide')}>
      <PlanCongratsModal
        show={showCongrats}
        onClose={() => setShowCongrats(false)}
        onNext={goToPicker}
        totalTasks={null}
      />
      <PlanResultView
        result={result}
        onRetry={retry}
        onPickAnother={goToPicker}
      />
    </div>
  );
}

export default PlanResultPage;
