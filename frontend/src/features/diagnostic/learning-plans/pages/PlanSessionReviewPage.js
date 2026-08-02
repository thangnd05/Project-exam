import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import PlanResultView from '../components/PlanResultView';
import { toPlanResult } from '../planResult';
import { usePlanSessionReview } from '~/features/diagnostic/learning-plans/hooks/usePlanSessionReview';
import styles from '~/features/diagnostic/styles/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

function PlanSessionReviewPage() {
  const { learningPlanId, sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get('taskId');
  const navigate = useNavigate();

  const query = usePlanSessionReview(learningPlanId, sessionId);

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

  return (
    <div className={cx('wrapper', 'studyWide')}>
      <div className={cx('headerBar')}>
        <Link to={backTo} className={cx('btn', 'btnOutline', 'btnSm')}>
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
