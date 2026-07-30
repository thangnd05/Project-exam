import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import classNames from 'classnames/bind';
import { getCurrentSession } from '~/shared/api/learningPlanApi';
import PlanResultView from '../components/PlanResultView';
import { toPlanResult } from '../planResult';
import styles from '~/features/diagnostic/styles/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

function PlanResultPage() {
  const { learningPlanId, taskId } = useParams();
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ['plan-result', learningPlanId, taskId],
    queryFn: () => getCurrentSession(learningPlanId, taskId, true),
    enabled: !!learningPlanId && !!taskId,

    staleTime: 0,
    gcTime: 0,
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

  return (
    <div className={cx('wrapper', 'studyWide')}>
      <PlanResultView
        result={toPlanResult(data)}
        onRetry={retry}
        onPickAnother={goToPicker}
      />
    </div>
  );
}

export default PlanResultPage;
