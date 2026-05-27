import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import { getMyUserTests } from '~/api/userTestApi';
import { getExamTypes } from '~/api/examTypeApi';
import { getUserTarget } from '~/api/userTargetApi';
import { listPlans, getPlanById } from '~/api/learningPlanApi';
import { getEnhancedResult } from '~/api/enhancedResultApi';
import styles from '../../learning-plan/styles/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

function pickRecommendedTask(plan) {
  if (!plan) return null;
  const allTasks = [
    ...(plan.tasks || []),
    ...((plan.partGroups || []).flatMap((g) => g.tasks || [])),
  ];
  const active = allTasks.filter((t) => t.status === 'ACTIVE');
  if (active.length === 0) return null;
  const sorted = [...active].sort((a, b) => {
    if (a.recommendedFirst && !b.recommendedFirst) return -1;
    if (!a.recommendedFirst && b.recommendedFirst) return 1;
    return (b.priorityScore ?? 0) - (a.priorityScore ?? 0);
  });
  return sorted[0];
}

function NextStepPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [examTypes, setExamTypes] = useState([]);
  const [examTypeId, setExamTypeId] = useState(searchParams.get('examTypeId') || '');

  const [target, setTarget] = useState(null);
  const [plans, setPlans] = useState([]);
  const [activePlanDetail, setActivePlanDetail] = useState(null);
  const [latestMock, setLatestMock] = useState(null);
  const [enhanced, setEnhanced] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getExamTypes().then(setExamTypes).catch(() => {});
  }, []);

  useEffect(() => {
    if (!examTypeId && examTypes.length > 0) setExamTypeId(examTypes[0].examTypeId);
  }, [examTypes, examTypeId]);

  const reload = useCallback(async () => {
    if (!examTypeId) return;
    setLoading(true);
    setError(null);
    try {
      const t = await getUserTarget(examTypeId).catch(() => null);
      setTarget(t);

      const ps = await listPlans(examTypeId).catch(() => []);
      setPlans(ps || []);
      const active = (ps || []).find((p) => p.status === 'ACTIVE');
      if (active) {
        const detail = await getPlanById(active.learningPlanId).catch(() => null);
        setActivePlanDetail(detail);
      } else {
        setActivePlanDetail(null);
      }

      const arr0 = await getMyUserTests();
      const arr = Array.isArray(arr0) ? arr0 : (arr0?.data || []);
      const completed = arr
        .filter((u) => u.status === 'COMPLETED' && u.finishedAt)
        .filter((u) => !u.examTypeId || u.examTypeId === examTypeId)
        .sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt));
      const latest = completed[0] || null;
      setLatestMock(latest);

      if (latest?.userTestId) {
        try {
          const r = await getEnhancedResult(latest.userTestId);
          setEnhanced(r.data);
        } catch {
          setEnhanced(null);
        }
      } else {
        setEnhanced(null);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [examTypeId]);

  useEffect(() => {
    reload();
  }, [reload]);

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
        ctaTo: '/',
      };
    }

    if (activePlanDetail) {
      const stage = activePlanDetail.planStage;
      if (stage === 'MOCK') {
        return {
          kind: 'do-mock',
          title: 'Bạn đã pass hết ải — đến lúc làm Mock kiểm tra',
          desc: `Plan #${activePlanDetail.planSequence} đã xong giai đoạn FOUNDATION. Làm một mock mới để cập nhật readiness.`,
          ctaLabel: 'Làm mock',
          ctaTo: '/',
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
        return {
          kind: 'study-task',
          title: `Học ải: ${recommended.examPartName} · ${recommended.tagName}`,
          desc: `Ưu tiên ${recommended.priorityTier}. Cần đạt ≥ ${recommended.passAccuracy}% để pass ải. Đã sai ${recommended.wrongCountAtDiagnosis ?? '—'} câu ở mock chẩn đoán.`,
          ctaLabel: 'Bắt đầu học',
          ctaTo: `/learning-plans/${activePlanDetail.learningPlanId}/study?taskId=${recommended.taskId}`,
          extras: [
            {
              label: 'Xem toàn bộ plan',
              to: `/learning-plans/${activePlanDetail.learningPlanId}`,
            },
          ],
        };
      }
    }

    return {
      kind: 'generate-plan',
      title: 'Sinh lộ trình từ mock gần nhất',
      desc: `Mock ${enhanced?.totalScore ?? latestMock.totalScore}đ · readiness ${enhanced?.readinessScore ?? '—'}% — chưa đạt target. Hệ thống sẽ tạo plan ải dựa trên các tag yếu.`,
      ctaLabel: 'Sinh plan',
      ctaTo: `/learning-plans/generate?userTestId=${latestMock.userTestId}`,
      extras: [
        {
          label: 'Xem chẩn đoán',
          to: `/tests/result/${latestMock.userTestId}`,
        },
      ],
    };
  }, [target, enhanced, latestMock, activePlanDetail, examTypeId]);

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
          <div className={cx('actionBar')}>
            <Link to={recommendation.ctaTo} className={cx('btn', 'btnPrimary', 'btnLg')}>
              {recommendation.ctaLabel}
            </Link>
            {(recommendation.extras || []).map((ex, i) => (
              <Link key={i} to={ex.to} className={cx('btn', 'btnOutline')}>
                {ex.label}
              </Link>
            ))}
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
                      enhanced?.readinessScore != null ? ` · readiness ${enhanced.readinessScore}%` : ''
                    }`
                  : <span className={cx('muted')}>chưa có</span>}
              </li>
              <li>
                <strong>Plan đang học:</strong>{' '}
                {activePlanDetail ? (
                  <>
                    Plan #{activePlanDetail.planSequence} · {activePlanDetail.passedTasks ?? 0}/
                    {activePlanDetail.totalTasks ?? 0} ải pass · stage {activePlanDetail.planStage}
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
