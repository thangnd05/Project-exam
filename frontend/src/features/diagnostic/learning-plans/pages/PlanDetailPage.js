import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import { ClipboardCheck, Play } from 'lucide-react';
import MockStageGuide from '../components/MockStageGuide';
import PlanCongratsModal, {
  congratsSeenKey,
  markCongratsSeen,
} from '../components/PlanCongratsModal';
import PlanPartTaskList from '../components/PlanPartTaskList';
import { usePlanDetail } from './hooks/usePlanDetail';
import { planStageLabel, planStatusLabel } from '../planLabels';
import { TERM_TIPS } from '~/features/diagnostic/termTips';
import { buildExamTypeDetailPath } from '~/shared/config/Routes';
import styles from '~/features/diagnostic/styles/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

function findRecommendedTask(plan) {
  if (!plan?.recommendedTaskId) return null;
  return (plan.partGroups || [])
    .flatMap((g) => g.tasks || [])
    .find((t) => t.taskId === plan.recommendedTaskId) || null;
}

function progressCheer(passed, total, pct) {
  if (total === 0) return 'Lộ trình đang chờ ải đầu tiên.';
  if (passed === 0) return 'Vượt ải đầu tiên hôm nay để khởi động lộ trình.';
  if (pct >= 100) return 'Bạn đã vượt toàn bộ ải — đến lúc thi thử để chốt kết quả!';
  if (pct >= 75) return `Chỉ còn ${total - passed} ải nữa là hết lộ trình. Về đích thôi!`;
  if (pct >= 40) return `Đã đi được hơn nửa chặng — còn ${total - passed} ải.`;
  return `Đã vượt ${passed} ải, đang có đà. Giữ nhịp mỗi ngày một ải nhé.`;
}

function PlanDetailPage() {
  const { learningPlanId } = useParams();
  const { plan, error, loading } = usePlanDetail(learningPlanId);
  const [showCongrats, setShowCongrats] = useState(false);

  useEffect(() => {
    if (!loading && window.location.hash === '#chon-ai-hoc') {
      document.getElementById('chon-ai-hoc')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading, plan]);

  // Lần đầu thấy plan đã vượt hết ải → hiện modal chúc mừng (mỗi plan một lần).
  useEffect(() => {
    if (!plan || plan.planStage !== 'MOCK' || plan.status === 'REPLACED') return;
    try {
      if (localStorage.getItem(congratsSeenKey(plan.learningPlanId))) return;
    } catch { /* localStorage bị chặn thì vẫn hiện modal */ }
    setShowCongrats(true);
  }, [plan]);

  const dismissCongrats = () => {
    setShowCongrats(false);
    markCongratsSeen(learningPlanId);
  };

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

  const partGroups = plan.partGroups || [];
  const isReplaced = plan.status === 'REPLACED';
  const recommendedTask = findRecommendedTask(plan);
  const totalTasks = plan.totalTasks ?? 0;
  const progressPct = totalTasks > 0
    ? Math.round(((plan.passedTasks ?? 0) / totalTasks) * 100)
    : 0;

  const backTo = plan.examTypeId
    ? `/learning-plans/generate?examTypeId=${plan.examTypeId}`
    : '/learning-plans/generate';

  const passedTasks = plan.passedTasks ?? 0;
  const isMockStage = plan.planStage === 'MOCK';
  const mockTestsTo = buildExamTypeDetailPath(plan.examTypeId);

  return (
    <div className={cx('wrapper')}>
      <PlanCongratsModal
        show={showCongrats}
        onClose={dismissCongrats}
        onNext={dismissCongrats}
        totalTasks={totalTasks}
        planSequence={plan.planSequence}
      />
      <div className={cx('headerBar')}>
        <Link to={backTo} className={cx('btn', 'btnOutline', 'btnSm')}>
          Quay lại
        </Link>
        <div className={cx('headerActions')}>
          <Link to={backTo} className={cx('btn', 'btnOutline', 'btnSm')}>
            Tất cả lộ trình
          </Link>
          <Link to="/learning-plans/generate" className={cx('btn', 'btnPrimary', 'btnSm')}>
            Sinh lộ trình mới
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
          <div className={cx('planHeroLead')}>
            <div className={cx('planHeroEyebrow')}>
              Lộ trình #{plan.planSequence ?? '?'} · {planStatusLabel(plan.status)}
            </div>
            <h2 className={cx('planHeroTitle')}>
              {plan.planStage === 'MOCK'
                ? 'Đã vượt hết ải — sẵn sàng thi thử!'
                : recommendedTask
                  ? `Ải tiếp theo: ${recommendedTask.examPartName} · ${recommendedTask.tagName}`
                  : 'Chinh phục từng ải để chạm mục tiêu'}
            </h2>
            <p className={cx('planHeroCheer')}>
              {progressCheer(passedTasks, totalTasks, progressPct)}
            </p>
            <div className={cx('planHeroBadges')}>
              <span className={cx('planHeroBadge')}>
                Giai đoạn: {planStageLabel(plan.planStage)}
              </span>
              {plan.targetScore != null && (
                <span className={cx('planHeroBadge')}>Mục tiêu: {plan.targetScore} điểm</span>
              )}
            </div>
          </div>

          {!isReplaced && isMockStage && (
            <div className={cx('planHeroCtaBox')}>
              <Link to={mockTestsTo} className={cx('planHeroCta')}>
                <ClipboardCheck size={16} /> Làm bài thi thử
              </Link>
              <span className={cx('planHeroCtaHint')}>Chấm lại độ sẵn sàng thật</span>
            </div>
          )}

          {!isReplaced && !isMockStage && recommendedTask && (
            <Link
              to={`/learning-plans/${plan.learningPlanId}/study?taskId=${recommendedTask.taskId}`}
              className={cx('planHeroCta')}
            >
              <Play size={16} /> Vào ải ngay
            </Link>
          )}
        </div>

        <div className={cx('planHeroProgressLabel')}>
          <span>
            Tiến độ: <strong>{passedTasks}/{totalTasks}</strong> ải đã xong
          </span>
          <strong>{progressPct}%</strong>
        </div>
        <div className={cx('planHeroProgressBar')}>
          <div
            className={cx('planHeroProgressFill')}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {!isReplaced && isMockStage && <MockStageGuide plan={plan} />}

      {plan.diagnosisSourcePractice && (
        <div className={cx('alert', 'alertWarning')}>
          <span>
            Lộ trình này chẩn đoán từ một <strong>bài luyện theo Part</strong> nên chỉ phủ các Part
            đã luyện. Làm bài thi thử trọn đề rồi sinh lại để có lộ trình đầy đủ.
          </span>
          <Link
            to={`/learning-plans/generate?examTypeId=${plan.examTypeId}`}
            className={cx('btn', 'btnPrimary', 'btnSm')}
          >
            Sinh lộ trình mới
          </Link>
        </div>
      )}

      {plan.partsWithoutTasks?.length > 0 && (
        <div className={cx('alert', 'alertWarning')}>
          Part chưa đạt mục tiêu nhưng chưa có ải (thiếu tag trên câu hỏi):{' '}
          <strong>{plan.partsWithoutTasks.join(', ')}</strong>
        </div>
      )}

      {!isReplaced && (
        <PlanPartTaskList
          partGroups={partGroups}
          learningPlanId={plan.learningPlanId}
          recommendedTaskId={plan.recommendedTaskId}
          studyAction="link"
          roadmapHeading={{
            title: 'Bản đồ ải của bạn',
            tip: TERM_TIPS.task,
            description: `${partGroups.length} chặng · ${totalTasks} ải.`,
          }}
        />
      )}
    </div>
  );
}

export default PlanDetailPage;
