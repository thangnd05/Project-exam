'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import PlanCongratsModal, { markCongratsSeen } from '../components/PlanCongratsModal';
import PlanResultView from '../components/PlanResultView';
import { toPlanResult } from '../planResult';
import { usePlanResult } from '~/features/diagnostic/learning-plans/hooks/usePlanResult';
import styles from '~/features/diagnostic/styles/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

function PlanResultPage() {
  const { learningPlanId, taskId } = useParams();
  const router = useRouter();
  const [showCongrats, setShowCongrats] = useState(false);

  const { result: sessionResult, isLoading, error: loadError } = usePlanResult(
    learningPlanId,
    taskId,
  );

  const goToPicker = () => router.push(`/learning-plans/${learningPlanId}`);
  const retry = () => router.push(`/learning-plans/${learningPlanId}/study?taskId=${taskId}`);

  // Vượt ải cuối → toàn bộ lộ trình đã xong: bật modal chúc mừng
  // và đánh dấu đã xem để trang kế hoạch không hiện lại lần nữa.
  const allTasksDone = !!sessionResult?.passed && sessionResult?.planStage === 'MOCK';
  useEffect(() => {
    if (!allTasksDone) return;
    setShowCongrats(true);
    markCongratsSeen(learningPlanId);
  }, [allTasksDone, learningPlanId]);

  if (isLoading) {
    return (
      <div className={cx('wrapper')}>
        <div className={cx('loading')}>Đang tải...</div>
      </div>
    );
  }

  if (loadError || !sessionResult?.lastReviewItems?.length) {
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

  const result = toPlanResult(sessionResult);

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
