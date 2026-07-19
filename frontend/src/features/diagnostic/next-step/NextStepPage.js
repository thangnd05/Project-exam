import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import { buildExamTypeDetailPath } from '~/shared/config/Routes';
import { getRecoveryResourceLinkProps } from '~/shared/utils/recoveryResource';
import { priorityTierLabel } from '~/shared/utils/priorityTier';
import { sortByPartOrder } from '~/shared/utils/partOrder';
import { planStageLabel } from '~/features/diagnostic/learning-plans/planLabels';
import { useExamTypes, useNextStepOverview } from './hooks/useNextStep';
import styles from '~/features/diagnostic/styles/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

// Chọn ải kế tiếp theo đúng thứ tự học BE đã sắp: Part trước học trước
// (sortByPartOrder), trong Part đi theo taskOrder — lấy ải ACTIVE gặp đầu tiên.
function pickRecommendedTask(plan) {
  if (!plan) return null;
  const groups = (plan.partGroups || []).length
    ? sortByPartOrder(plan.partGroups, { nameKey: 'examPartName' })
    : [{ tasks: plan.tasks || [] }];
  for (const group of groups) {
    const tasks = [...(group.tasks || [])].sort(
      (a, b) => (a.taskOrder ?? 0) - (b.taskOrder ?? 0),
    );
    const active = tasks.find((t) => t.status === 'ACTIVE');
    if (active) return active;
  }
  return null;
}

function NextStepPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [examTypeId, setExamTypeId] = useState(searchParams.get('examTypeId') || '');

  const { data: examTypes = [] } = useExamTypes();

  const overviewQuery = useNextStepOverview(examTypeId);
  const { target, plans, activePlanDetail, latestMock, enhanced } =
    overviewQuery.data ?? {
      target: null,
      plans: [],
      activePlanDetail: null,
      latestMock: null,
      enhanced: null,
    };
  const loading = overviewQuery.isLoading;
  const error = overviewQuery.error
    ? overviewQuery.error?.response?.data?.message || overviewQuery.error.message
    : null;

  useEffect(() => {
    if (!examTypeId && examTypes.length > 0) setExamTypeId(examTypes[0].examTypeId);
  }, [examTypes, examTypeId]);

  const mockTestsPath = buildExamTypeDetailPath(examTypeId);

  const recommendation = useMemo(() => {
    if (!target?.hasTarget) {
      return {
        kind: 'set-target',
        title: 'Hãy đặt mục tiêu cho kỳ thi này trước',
        desc: 'Mục tiêu giúp hệ thống cá nhân hoá lộ trình ôn (điểm + aim từng Part).',
        ctaLabel: 'Đặt mục tiêu',
        ctaTo: `/my-target?examTypeId=${examTypeId}`,
      };
    }

    const enhancedMatches =
      enhanced && (!enhanced.examTypeId || enhanced.examTypeId === examTypeId);
    const isAchieved = Boolean(target.achievedAt)
      || (enhancedMatches && enhanced?.isTargetMet === true);

    if (isAchieved) {
      return {
        kind: 'achieved',
        title: `Chúc mừng — đã đạt ${target.targetScore} điểm!`,
        desc: target.achievedAt
          ? `Mục tiêu đã đạt. Đặt mục tiêu mới để giữ phong độ.`
          : `Mock gần nhất ${enhanced?.totalScore}đ ≥ mục tiêu. Đặt mục tiêu mới để giữ phong độ.`,
        ctaLabel: 'Đặt mục tiêu mới',
        ctaTo: `/my-target/achieved?examTypeId=${examTypeId}`,
      };
    }

    if (!latestMock) {
      return {
        kind: 'do-mock',
        title: 'Làm một bài Full Mock chẩn đoán',
        desc: 'Chưa có bài thi nào COMPLETED. Hệ thống cần một mock để biết điểm yếu của bạn.',
        ctaLabel: 'Chọn đề thi',
        ctaTo: mockTestsPath,
      };
    }

    if (activePlanDetail) {
      const stage = activePlanDetail.planStage;
      if (stage === 'MOCK') {
        return {
          kind: 'do-mock',
          title: 'Bạn đã pass hết ải — đến lúc làm Mock kiểm tra',
          desc: `Plan #${activePlanDetail.planSequence} đã xong giai đoạn nền tảng. Làm một mock mới để cập nhật độ sẵn sàng.`,
          ctaLabel: 'Làm mock',
          ctaTo: mockTestsPath,
          extras: [
            {
              label: `Xem Plan #${activePlanDetail.planSequence}`,
              to: `/learning-plans/${activePlanDetail.learningPlanId}`,
            },
          ],
        };
      }

      const recommended = pickRecommendedTask(activePlanDetail);
      if (recommended) {
        const stuck = (recommended.consecutiveFails ?? 0) >= 3;
        const studyResource = recommended.studyResource;
        const studyResourceLink = studyResource
          ? getRecoveryResourceLinkProps(studyResource)
          : null;
        const extras = [];
        if (stuck && studyResourceLink) {
          extras.push({
            label: 'Mở tài liệu ôn',
            to: studyResourceLink.external ? studyResourceLink.href : studyResourceLink.to,
            external: studyResourceLink.external,
          });
        }
        extras.push({
          label: 'Xem toàn bộ plan',
          to: `/learning-plans/${activePlanDetail.learningPlanId}`,
        });
        return {
          kind: 'study-task',
          title: `Học ải: ${recommended.examPartName} · ${recommended.tagName}`,
          desc: `${priorityTierLabel(recommended.priorityTier)}. Cần đạt ≥ ${recommended.passAccuracy}% để pass ải. Đã sai ${recommended.wrongCountAtDiagnosis ?? '—'} câu ở mock chẩn đoán.`,
          warning: stuck
            ? `Bạn đã fail ${recommended.consecutiveFails} lần liên tiếp ở ải này. Hãy đọc lại tài liệu trước khi thử lần nữa.`
            : null,
          ctaLabel: 'Bắt đầu học',
          ctaTo: `/learning-plans/${activePlanDetail.learningPlanId}/study?taskId=${recommended.taskId}`,
          extras,
        };
      }
    }

    return {
      kind: 'generate-plan',
      title: 'Sinh lộ trình từ mock gần nhất',
      desc: `Mock ${enhanced?.totalScore ?? latestMock.totalScore}đ · độ sẵn sàng ${enhanced?.readinessScore ?? '—'}% — chưa đạt mục tiêu. Hệ thống sẽ tạo plan ải dựa trên các tag yếu.`,
      ctaLabel: 'Sinh plan',
      ctaTo: `/learning-plans/generate?userTestId=${latestMock.userTestId}`,
      extras: [
        {
          label: 'Xem chẩn đoán',
          to: `/tests/result/${latestMock.userTestId}`,
        },
      ],
    };
  }, [target, enhanced, latestMock, activePlanDetail, examTypeId, mockTestsPath]);

  return (
    <div className={cx('wrapper')}>
      <div className={cx('headerBar')}>
        <h2 className={cx('title')}>Tiếp theo nên làm gì?</h2>
        <Link
          to={examTypeId ? `/my-target/dashboard?examTypeId=${examTypeId}` : '/my-target/dashboard'}
          className={cx('btn', 'btnOutline', 'btnSm')}
        >
          Tổng quan mục tiêu
        </Link>
      </div>

      <div className={cx('filterRow')}>
        <div className={cx('fieldGroup')}>
          <label className={cx('fieldLabel')}>Loại kỳ thi</label>
          <select
            className={cx('select')}
            value={examTypeId}
            onChange={(e) => {
              setExamTypeId(e.target.value);
              setSearchParams({ examTypeId: e.target.value });
            }}
          >
            {examTypes.map((et) => (
              <option key={et.examTypeId} value={et.examTypeId}>{et.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className={cx('alert', 'alertDanger')}>{error}</div>}
      {loading && <div className={cx('loading')}>Đang phân tích...</div>}

      {!loading && recommendation && (
        <div className={cx('recoBox')}>
          <div className={cx('recoTag')}>Gợi ý cho bạn</div>
          <h3 className={cx('recoTitle')}>{recommendation.title}</h3>
          <p className={cx('recoDesc')}>{recommendation.desc}</p>
          {recommendation.warning && (
            <div className={cx('alert', 'alertWarning')}>
              {recommendation.warning}
            </div>
          )}
          <div className={cx('actionBar')}>
            <Link to={recommendation.ctaTo} className={cx('btn', 'btnPrimary', 'btnLg')}>
              {recommendation.ctaLabel}
            </Link>
            {(recommendation.extras || []).map((ex, i) =>
              ex.external ? (
                <a
                  key={i}
                  href={ex.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cx('btn', 'btnOutline')}
                >
                  {ex.label}
                </a>
              ) : (
                <Link key={i} to={ex.to} className={cx('btn', 'btnOutline')}>
                  {ex.label}
                </Link>
              )
            )}
          </div>
        </div>
      )}

      {!loading && (
        <div className={cx('card')}>
          <div className={cx('cardHeader')}>Trạng thái hiện tại</div>
          <div className={cx('cardBody')}>
            <ul className={cx('metaList')} style={{ marginBottom: 0 }}>
              <li>
                <strong>Target:</strong>{' '}
                {target?.hasTarget
                  ? `${target.targetScore} điểm`
                  : <span className={cx('muted')}>chưa đặt</span>}
              </li>
              <li>
                <strong>Mock gần nhất:</strong>{' '}
                {latestMock
                  ? `${enhanced?.totalScore ?? latestMock.totalScore ?? '—'}đ${
                      enhanced?.readinessScore != null ? ` · độ sẵn sàng ${enhanced.readinessScore}%` : ''
                    }`
                  : <span className={cx('muted')}>chưa có</span>}
              </li>
              <li>
                <strong>Plan đang học:</strong>{' '}
                {activePlanDetail ? (
                  <>
                    Plan #{activePlanDetail.planSequence} · {activePlanDetail.passedTasks ?? 0}/
                    {activePlanDetail.totalTasks ?? 0} ải đã qua · giai đoạn {planStageLabel(activePlanDetail.planStage)}
                  </>
                ) : (
                  <span className={cx('muted')}>không có</span>
                )}
              </li>
              <li>
                <strong>Tổng số plan:</strong> {plans.length}
                {plans.length > 0 && (
                  <>
                    {' '}
                    <Link to={`/learning-plans/compare?examTypeId=${examTypeId}`}>
                      So sánh các plan →
                    </Link>
                  </>
                )}
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default NextStepPage;
