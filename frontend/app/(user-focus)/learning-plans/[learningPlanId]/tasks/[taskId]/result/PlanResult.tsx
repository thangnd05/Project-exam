'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import PlanCongratsModal, { markCongratsSeen } from '@/app/components/learning-plans/PlanCongratsModal/PlanCongratsModal';
import PlanResultView from '@/app/components/learning-plans/PlanResultView/PlanResultView';
import { toPlanResult } from '@/app/utils/planResult';
import { usePlanResult } from './_hooks/usePlanResult';
import styles from '@/app/assets/styles/diagnostic/PersonalizedPlan.module.scss';
import { PlanStage } from '@/app/enums';

const cx = classNames.bind(styles);

function PlanResult() {
  const { learningPlanId, taskId } = useParams<{ learningPlanId: string; taskId: string }>();
  const router = useRouter();
  const [showCongrats, setShowCongrats] = useState(false);

  const { result: sessionResult, isLoading, error: loadError } = usePlanResult(
    learningPlanId,
    taskId,
  );

  const goToPicker = () => router.push(`/learning-plans/${learningPlanId}`);
  const retry = () => router.push(`/learning-plans/${learningPlanId}/study?taskId=${taskId}`);

  const allTasksDone = !!sessionResult?.passed && sessionResult?.planStage === PlanStage.MOCK;
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

export default PlanResult;
