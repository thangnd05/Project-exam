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
  return plan.baselineReadiness ?? null;
}

// Tìm ải được BE gợi ý làm tiếp (cùng logic với NextStepPage).
function findRecommendedTask(plan) {
  if (!plan?.recommendedTaskId) return null;
  const all = (plan.partGroups || []).flatMap((g) => g.tasks || []);
  const pool = all.length ? all : plan.tasks || [];
  return pool.find((t) => t.taskId === plan.recommendedTaskId) || null;
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
        <div className={cx('headerBar')}>
          <Link to="/learning-plans/generate" className={cx('btn', 'btnOutline', 'btnSm')}>
            Quay lại
          </Link>
        </div>
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
  const recommendedTask = findRecommendedTask(plan);
  const totalTasks = plan.totalTasks ?? 0;
  const progressPct = totalTasks > 0
    ? Math.round(((plan.passedTasks ?? 0) / totalTasks) * 100)
    : 0;

  const backTo = plan.examTypeId
    ? `/learning-plans/generate?examTypeId=${plan.examTypeId}`
    : '/learning-plans/generate';

  return (
    <div className={cx('wrapper')}>
      <div className={cx('headerBar')}>
        <div className={cx('actionBar')}>
          <Link to={backTo} className={cx('btn', 'btnOutline', 'btnSm')}>
            Quay lại
          </Link>
          <h2 className={cx('title')}>
            Kế hoạch học
            {plan.planSequence != null ? ` #${plan.planSequence}` : ''}
          </h2>
        </div>
        <div className={cx('actionBar')}>
          <Link to="/learning-plans/generate" className={cx('btn', 'btnOutline', 'btnSm')}>
            Sinh lộ trình mới
          </Link>
          <Link to={backTo} className={cx('btn', 'btnOutline', 'btnSm')}>
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
              Xem lộ trình mới
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

      <div className={cx('planHero')}>
        <div className={cx('planHeroTop')}>
          <div>
            <div className={cx('planHeroEyebrow')}>
              Lộ trình #{plan.planSequence ?? '?'} · {planStatusLabel(plan.status)}
            </div>
            <h3 className={cx('planHeroTitle')}>
              {plan.planStage === 'MOCK'
                ? 'Đã vượt hết ải — sẵn sàng thi thử!'
                : recommendedTask
                  ? `Ải tiếp theo: ${recommendedTask.examPartName} · ${recommendedTask.tagName}`
                  : 'Chinh phục từng ải để chạm mục tiêu'}
            </h3>
            <div className={cx('planHeroBadges')}>
              <span className={cx('planHeroBadge')}>
                Giai đoạn: {planStageLabel(plan.planStage)}
              </span>
              <span className={cx('planHeroBadge')}>
                Độ sẵn sàng lúc tạo: {baseline != null ? `${baseline}%` : '—'}
                {plan.readinessLevel ? ` · ${getReadinessLabel(plan.readinessLevel)}` : ''}
              </span>
            </div>
          </div>
          {!isReplaced && recommendedTask && plan.planStage !== 'MOCK' && (
            <Link
              to={`/learning-plans/${plan.learningPlanId}/study?taskId=${recommendedTask.taskId}`}
              className={cx('planHeroCta')}
            >
              Học ngay
            </Link>
          )}
        </div>

        <div className={cx('planHeroProgressLabel')}>
          <span>
            Tiến độ: <strong>{plan.passedTasks ?? 0}/{plan.totalTasks ?? 0}</strong> ải đã vượt
          </span>
          <strong>{progressPct}%</strong>
        </div>
        <div className={cx('planHeroProgressBar')}>
          <div
            className={cx('planHeroProgressFill')}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <p className={cx('planHeroNote')}>
          Mỗi bài làm mới sinh lộ trình mới (lộ trình cũ giữ lịch sử, không sửa đè ải).
        </p>
      </div>

      {!isReplaced && plan.planStage === 'FOUNDATION' && (
        <div className={cx('alert')}>
          <span>
            {plan.diagnosisSourceCategory === 'QUICK_CHALLENGE' ? (
              <>
                Lộ trình này được chẩn đoán từ một <strong>bài thử thách nhanh</strong> (ngắn) — đủ để
                bắt đầu ôn. Ôn xong các ải, hãy làm một <strong>bài thi thử đầy đủ</strong> để chẩn đoán
                chính xác hơn (nếu chưa đạt sẽ sinh lộ trình mới sát hơn).
              </>
            ) : (
              <>
                Lộ trình này được chẩn đoán từ bài bạn đã làm gần nhất. Ôn xong các ải,
                hãy làm một <strong>bài thi thử đầy đủ</strong> để kiểm tra lại và cập nhật
                độ chính xác của chẩn đoán (nếu chưa đạt sẽ sinh lộ trình mới sát hơn).
              </>
            )}
          </span>
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
