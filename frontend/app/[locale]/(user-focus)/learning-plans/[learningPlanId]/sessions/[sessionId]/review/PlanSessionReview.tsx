'use client';

import Link, { useRouter } from '@/app/i18n/navigation';
import { useParams, useSearchParams } from 'next/navigation';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import PlanResultView from '@/app/features/learning-plans/PlanResultView/PlanResultView';
import { toPlanResult } from '@/app/features/learning-plans/planResult';
import { usePlanSessionReview } from './_hooks/usePlanSessionReview';
import styles from '@/app/assets/styles/diagnostic/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

function PlanSessionReview() {
  const t = useTranslations('LearningPlans');
  const tc = useTranslations('Common');
  const { learningPlanId, sessionId } = useParams<{ learningPlanId: string; sessionId: string }>();
  const searchParams = useSearchParams();
  const taskId = searchParams.get('taskId');
  const router = useRouter();

  const { review, isLoading, error: loadError } = usePlanSessionReview(
    learningPlanId,
    sessionId,
  );

  const backTo = taskId
    ? `/learning-plans/${learningPlanId}/tasks/${taskId}/history`
    : `/learning-plans/${learningPlanId}`;

  const goToPicker = () => router.push(`/learning-plans/${learningPlanId}`);
  const retry = () =>
    router.push(taskId
        ? `/learning-plans/${learningPlanId}/study?taskId=${taskId}`
        : `/learning-plans/${learningPlanId}`);

  if (isLoading) {
    return (
      <div className={cx('wrapper')}>
        <div className={cx('loading')}>{tc('loading')}</div>
      </div>
    );
  }

  const data = review;

  if (loadError || !data?.lastReviewItems?.length) {
    return (
      <div className={cx('wrapper')}>
        <div className={cx('headerBar')}>
          <Link href={backTo} className={cx('btn', 'btnGhost', 'btnSm')}>
            ← {taskId ? t('review.taskHistory') : t('common.plan')}
          </Link>
        </div>
        <div className={cx('alert', 'alertDanger')}>
          {loadError || t('review.noReview')}
        </div>
      </div>
    );
  }

  return (
    <div className={cx('wrapper', 'studyWide')}>
      <div className={cx('headerBar')}>
        <Link href={backTo} className={cx('btn', 'btnOutline', 'btnSm')}>
          {t('common.back')}
        </Link>
      </div>
      <PlanResultView
        result={toPlanResult(data)}
        onRetry={retry}
        onPickAnother={goToPicker}
      />
    </div>
  );
}

export default PlanSessionReview;
