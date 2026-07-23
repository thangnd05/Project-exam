import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import InfoTip from '~/shared/ui/InfoTip/InfoTip';
import { TERM_TIPS } from '~/features/diagnostic/termTips';
import PlanPartTaskList, { groupTasksByPart } from '../components/PlanPartTaskList';
import { usePlanDetail } from './hooks/usePlanDetail';
import { planStageLabel, planStatusLabel } from '../planLabels';
import { getReadinessLabel } from '~/features/diagnostic/target/utils/readiness-label';
import styles from '~/features/diagnostic/styles/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

function planBaselineReadiness(plan) {
  if (plan == null) return null;
  return plan.baselineReadiness ?? plan.currentReadiness ?? null;
}

function PlanDetailPage() {
  const { learningPlanId } = useParams();
  const { plan, error, loading } = usePlanDetail(learningPlanId);

  useEffect(() => {
    if (!loading && window.location.hash === '#chon-ai-hoc') {
      document.getElementById('chon-ai-hoc')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading, plan]);

  if (loading) {
    return <div className={cx('wrapper')}><div className={cx('loading')}>Đang tải...</div></div>;
  }
  if (error && !plan) {
    return (
      <div className={cx('wrapper')}>
        <div className={cx('alert', 'alertDanger')}>{error}</div>
      </div>
    );
  }
  if (!plan) return null;

  const partGroups = plan.partGroups?.length
    ? plan.partGroups
    : groupTasksByPart(plan.tasks || []);
  const baseline = planBaselineReadiness(plan);
  const isReplaced = plan.status === 'REPLACED';

  return (
    <div className={cx('wrapper')}>
      <div className={cx('headerBar')}>
        <h2 className={cx('title')}>
          Kế hoạch học
          {plan.planSequence != null ? ` #${plan.planSequence}` : ''}
        </h2>
        <div className={cx('actionBar')}>
          <Link to="/learning-plans/generate" className={cx('btn', 'btnOutline', 'btnSm')}>
            Sinh lộ trình mới
          </Link>
          <Link
            to={`/learning-plans/generate?examTypeId=${plan.examTypeId}`}
            className={cx('btn', 'btnOutline', 'btnSm')}
          >
            Tất cả lộ trình
          </Link>
        </div>
      </div>

      {error && <div className={cx('alert', 'alertDanger')}>{error}</div>}

      {isReplaced && (
        <div className={cx('alert', 'alertWarning')}>
          <span>Lộ trình này đã được thay bằng lộ trình mới hơn.</span>
          {plan.replacedByPlanId && (
            <Link
              to={`/learning-plans/${plan.replacedByPlanId}`}
              className={cx('btn', 'btnPrimary', 'btnSm')}
            >
              Xem lộ trình mới →
            </Link>
          )}
        </div>
      )}

      {!isReplaced && plan.targetOutdated && (
        <div className={cx('alert', 'alertWarning')}>
          <span>
            Lộ trình này sinh theo <strong>mục tiêu cũ</strong> — ngưỡng vượt ải chưa áp
            mục tiêu hiện tại. Sinh lộ trình mới để cập nhật.
          </span>
          <Link
            to={`/learning-plans/generate?examTypeId=${plan.examTypeId}`}
            className={cx('btn', 'btnPrimary', 'btnSm')}
          >
            Sinh lộ trình mới
          </Link>
        </div>
      )}

      <div className={cx('card')}>
        <div className={cx('cardBody')}>
          {plan.summary && (
            <p style={{ marginBottom: '1.2rem', fontSize: 'var(--font-size-ssm)' }}>
              {plan.summary}
            </p>
          )}
          <ul className={cx('metaList')} style={{ marginBottom: 0 }}>
            <li>
              <strong>Trạng thái:</strong>{' '}
              {planStatusLabel(plan.status)}
            </li>
            <li>
              <strong>Giai đoạn:</strong>{' '}
              {planStageLabel(plan.planStage)}
            </li>
            <li>
              <strong>Độ sẵn sàng lúc tạo plan:</strong>
              <InfoTip text={TERM_TIPS.readiness} />{' '}
              {baseline != null ? `${baseline}%` : '—'}
              {plan.readinessLevel ? ` (${getReadinessLabel(plan.readinessLevel)})` : ''}
            </li>
            <li>
              <strong>Tiến độ ải:</strong>{' '}
              {plan.passedTasks ?? 0}/{plan.totalTasks ?? 0} đã vượt
            </li>
            <li className={cx('muted', 'small')}>
              Mỗi bài làm mới sinh <strong>lộ trình mới</strong> (lộ trình cũ giữ lịch sử, không sửa đè ải).
            </li>
          </ul>
        </div>
      </div>

      {!isReplaced && plan.planStage === 'FOUNDATION' && (
        <div className={cx('alert')}>
          Lộ trình này được chẩn đoán từ bài bạn đã làm gần nhất. Ôn xong các ải,
          hãy làm một <strong>bài thi thử đầy đủ</strong> để kiểm tra lại và cập nhật độ chính
          xác của chẩn đoán (nếu chưa đạt sẽ sinh lộ trình mới sát hơn).
        </div>
      )}

      {plan.partsWithoutTasks?.length > 0 && (
        <div className={cx('alert', 'alertWarning')}>
          Part chưa đạt mục tiêu nhưng chưa có ải (thiếu tag trên câu hỏi):{' '}
          <strong>{plan.partsWithoutTasks.join(', ')}</strong>
        </div>
      )}

      {!isReplaced && (
        <>
          <h3 id="chon-ai-hoc" className={cx('sectionTitle')} style={{ fontSize: 'var(--font-size-lg)', marginTop: '2rem', marginBottom: '1.2rem' }}>
            Chọn Part và ải để học ({partGroups.length})
            <InfoTip text={TERM_TIPS.task} />
          </h3>
          <PlanPartTaskList
            partGroups={partGroups}
            learningPlanId={plan.learningPlanId}
            recommendedTaskId={plan.recommendedTaskId}
            studyAction="link"
          />
        </>
      )}
    </div>
  );
}

export default PlanDetailPage;
