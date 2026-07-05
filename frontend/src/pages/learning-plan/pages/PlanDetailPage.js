import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import PlanPartTaskList, { groupTasksByPart } from '../components/PlanPartTaskList';
import { usePlanDetail } from './hooks/usePlanDetail';
import styles from '../styles/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

const STAGE_LABELS = {
  FOUNDATION: 'Đang ôn theo Part',
  MIX: 'Đang chuyển (plan cũ)',
  MOCK: 'Xong ải — làm Mock',
};

const STATUS_LABEL = {
  ACTIVE: 'Đang học',
  COMPLETED: 'Hoàn thành',
  REPLACED: 'Đã thay bằng plan mới',
  ABANDONED: 'Đã bỏ',
};

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
            Sinh plan mới
          </Link>
          <Link
            to={`/learning-plans/generate?examTypeId=${plan.examTypeId}`}
            className={cx('btn', 'btnOutline', 'btnSm')}
          >
            Tất cả plan
          </Link>
        </div>
      </div>

      {error && <div className={cx('alert', 'alertDanger')}>{error}</div>}

      {isReplaced && (
        <div className={cx('alert', 'alertWarning')}>
          <span>Plan này đã được thay bằng lộ trình mới (mock sau).</span>
          {plan.replacedByPlanId && (
            <Link
              to={`/learning-plans/${plan.replacedByPlanId}`}
              className={cx('btn', 'btnPrimary', 'btnSm')}
            >
              Xem plan mới →
            </Link>
          )}
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
              {STATUS_LABEL[plan.status] || plan.status}
            </li>
            <li>
              <strong>Giai đoạn:</strong>{' '}
              {STAGE_LABELS[plan.planStage] || plan.planStage}
            </li>
            <li>
              <strong>Readiness lúc tạo plan:</strong>{' '}
              {baseline != null ? `${baseline}%` : '—'}
              {plan.readinessLevel ? ` (${plan.readinessLevel})` : ''}
            </li>
            <li>
              <strong>Tiến độ ải:</strong>{' '}
              {plan.passedTasks ?? 0}/{plan.totalTasks ?? 0} đã pass
            </li>
            <li className={cx('muted', 'small')}>
              Mỗi mock mới → sinh <strong>plan mới</strong> (plan cũ giữ lịch sử, không sửa đè ải).
            </li>
          </ul>
        </div>
      </div>

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
          </h3>
          <PlanPartTaskList
            partGroups={partGroups}
            learningPlanId={plan.learningPlanId}
            studyAction="link"
          />
        </>
      )}
    </div>
  );
}

export default PlanDetailPage;
