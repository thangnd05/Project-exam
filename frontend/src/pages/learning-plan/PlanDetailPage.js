import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPlanById } from '~/api/learningPlanApi';
import PlanPartTaskList, { groupTasksByPart } from './components/PlanPartTaskList';

const STAGE_LABELS = {
  FOUNDATION: 'Đang ôn theo Part',
  MIX: 'Đang chuyển (plan cũ)',
  MOCK: 'Xong ải — làm Mock',
};

const PLAN_STATUS_LABEL = {
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
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadPlan = useCallback(() => {
    setLoading(true);
    setError(null);
    return getPlanById(learningPlanId)
      .then((data) => {
        setPlan(data);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [learningPlanId]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  useEffect(() => {
    if (!loading && window.location.hash === '#chon-ai-hoc') {
      document.getElementById('chon-ai-hoc')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading, plan]);

  if (loading) return <div className="container py-4">Đang tải...</div>;
  if (error && !plan) {
    return <div className="container py-4"><div className="alert alert-danger">{error}</div></div>;
  }
  if (!plan) return null;

  const partGroups = plan.partGroups?.length
    ? plan.partGroups
    : groupTasksByPart(plan.tasks || []);
  const baseline = planBaselineReadiness(plan);
  const isReplaced = plan.status === 'REPLACED';

  return (
    <div className="container py-4">
      <h2 className="mb-3">
        Kế hoạch học
        {plan.planSequence != null ? ` #${plan.planSequence}` : ''}
      </h2>

      {error && <div className="alert alert-danger">{error}</div>}

      {isReplaced && (
        <div className="alert alert-secondary">
          Plan này đã được thay bằng lộ trình mới (mock sau).
          {plan.replacedByPlanId && (
            <>
              {' '}
              <Link to={`/learning-plans/${plan.replacedByPlanId}`}>Xem plan mới →</Link>
            </>
          )}
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body">
          <p>{plan.summary}</p>
          <ul className="list-unstyled mb-0">
            <li>
              <strong>Trạng thái plan:</strong>{' '}
              {PLAN_STATUS_LABEL[plan.status] || plan.status}
            </li>
            <li><strong>Giai đoạn:</strong> {STAGE_LABELS[plan.planStage] || plan.planStage}</li>
            <li>
              <strong>Readiness lúc tạo plan:</strong>{' '}
              {baseline != null ? `${baseline}%` : '—'}
              {plan.readinessLevel ? ` (${plan.readinessLevel})` : ''}
            </li>
            <li><strong>Tiến độ ải:</strong> {plan.passedTasks ?? 0}/{plan.totalTasks ?? 0} đã pass</li>
            <li className="text-muted small">
              Mỗi mock mới → sinh <strong>plan mới</strong> (plan cũ giữ lịch sử, không sửa đè ải).
            </li>
          </ul>
        </div>
      </div>

      {plan.partsWithoutTasks?.length > 0 && (
        <div className="alert alert-warning">
          Part chưa đạt mục tiêu nhưng chưa có ải (thiếu tag trên câu hỏi):
          {' '}
          <strong>{plan.partsWithoutTasks.join(', ')}</strong>
        </div>
      )}

      {!isReplaced && (
        <>
          <h4 id="chon-ai-hoc" className="mb-3">
            Chọn Part và ải để học ({partGroups.length})
          </h4>
          <PlanPartTaskList
            partGroups={partGroups}
            learningPlanId={plan.learningPlanId}
            studyAction="link"
          />
        </>
      )}

      <div className="mt-3">
        <Link to="/learning-plans/generate" className="btn btn-sm btn-outline-primary me-2">
          Sinh plan mới từ mock
        </Link>
        <Link to={`/learning-plans?examTypeId=${plan.examTypeId}`} className="btn btn-sm btn-outline-secondary">
          Tất cả plan
        </Link>
      </div>
    </div>
  );
}

export default PlanDetailPage;
