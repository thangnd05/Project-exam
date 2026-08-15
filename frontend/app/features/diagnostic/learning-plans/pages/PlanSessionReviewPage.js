'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import classNames from 'classnames/bind';
import PlanResultView from '../components/PlanResultView';
import { toPlanResult } from '../planResult';
import { usePlanSessionReview } from '@/app/features/diagnostic/learning-plans/hooks/usePlanSessionReview';
import styles from '@/app/features/diagnostic/styles/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

function PlanSessionReviewPage() {
  const { learningPlanId, sessionId } = useParams();
  const [searchParams] = useSearchParams();
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
        <div className={cx('loading')}>Đang tải...</div>
      </div>
    );
  }

  const data = review;

  if (loadError || !data?.lastReviewItems?.length) {
    return (
      <div className={cx('wrapper')}>
        <div className={cx('headerBar')}>
          <Link href={backTo} className={cx('btn', 'btnGhost', 'btnSm')}>
            ← {taskId ? 'Lịch sử ải' : 'Kế hoạch'}
          </Link>
        </div>
        <div className={cx('alert', 'alertDanger')}>
          {loadError || 'Không có bài làm nào cho lượt luyện này.'}
        </div>
      </div>
    );
  }

  return (
    <div className={cx('wrapper', 'studyWide')}>
      <div className={cx('headerBar')}>
        <Link href={backTo} className={cx('btn', 'btnOutline', 'btnSm')}>
          Quay lại
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

export default PlanSessionReviewPage;
