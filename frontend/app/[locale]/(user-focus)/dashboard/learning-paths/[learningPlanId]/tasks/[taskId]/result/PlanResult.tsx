'use client';

import { useParams } from 'next/navigation';
import { useRouter } from '@/app/i18n/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import classNames from 'classnames/bind';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import PlanCongratsModal, { markCongratsSeen } from '@/app/features/learning-plans/PlanCongratsModal/PlanCongratsModal';
import PlanResultView from '@/app/features/learning-plans/PlanResultView/PlanResultView';
import { toPlanResult } from '@/app/features/learning-plans/planResult';
import { usePlanResult } from './_hooks/usePlanResult';
import { usePlanDetail } from '@/app/features/learning-plans/hooks/usePlanDetail';
import styles from '@/app/assets/styles/diagnostic/PersonalizedPlan.module.scss';
import { PlanStage } from '@/app/enums';

const cx = classNames.bind(styles);

function PlanResult() {
  const t = useTranslations('LearningPlans');
  const tc = useTranslations('Common');
  const { learningPlanId, taskId } = useParams<{ learningPlanId: string; taskId: string }>();
  const router = useRouter();
  const [showCongrats, setShowCongrats] = useState(false);

  const { result: sessionResult, isLoading, error: loadError } = usePlanResult(
    learningPlanId,
    taskId,
  );

  const goToPicker = () => router.push(`/dashboard/learning-paths/${learningPlanId}`);
  const retry = () => router.push(`/dashboard/learning-paths/${learningPlanId}/study?taskId=${taskId}`);

  const allTasksDone = !!sessionResult?.passed && sessionResult?.planStage === PlanStage.MOCK;

  // Nộp ải xong thì lộ trình đã được tải lại, ải được gợi ý lúc này chính là ải kế tiếp.
  const { plan } = usePlanDetail(learningPlanId);
  const nextTaskId = plan?.recommendedTaskId;
  const goToNext = !allTasksDone && nextTaskId && nextTaskId !== taskId
    ? () => router.push(`/dashboard/learning-paths/${learningPlanId}/study?taskId=${nextTaskId}`)
    : undefined;
  // Vừa vượt hết ải thì bật modal chúc mừng (một lần cho mỗi lộ trình).
  const congratsKey = allTasksDone ? learningPlanId : null;
  const [prevCongratsKey, setPrevCongratsKey] = useState<string | null>(null);
  if (congratsKey !== prevCongratsKey) {
    setPrevCongratsKey(congratsKey);
    if (congratsKey) setShowCongrats(true);
  }
  useEffect(() => {
    if (!allTasksDone) return;
    markCongratsSeen(learningPlanId);
  }, [allTasksDone, learningPlanId]);

  if (isLoading) {
    return (
      <div className={cx('wrapper')}>
        <div className={cx('loading')}>{tc('loading')}</div>
      </div>
    );
  }

  if (loadError || !sessionResult?.lastReviewItems?.length) {
    return (
      <div className={cx('wrapper')}>
        <div className={cx('headerBar')}>
          <ButtonPrime variant="ghost" size="sm" onClick={goToPicker}>
            ← {t('common.plan')}
          </ButtonPrime>
        </div>
        <div className={cx('alert', 'alertDanger')}>
          {loadError || t('result.noResult')}
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
        onNext={goToNext}
      />
    </div>
  );
}

export default PlanResult;
