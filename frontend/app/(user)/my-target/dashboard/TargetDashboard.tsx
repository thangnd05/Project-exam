'use client';

import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import classNamesBind from 'classnames/bind';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import TargetPlanTabs from '@/app/components/TargetPlanTabs/TargetPlanTabs';
import { sortPartsByLookup } from '@/app/utils/partOrder';
import { formatDateTime24 as formatDate } from '@/app/utils/format-date-time';
import { useSearchParamsState } from '@/app/hooks/useSearchParamsState';
import MockHistoryPanel from './_components/MockHistoryPanel';
import TargetDashboardPartChart, { type PartChartRow } from './_components/TargetDashboardPartChart';
import { useTargetDashboard } from '@/app/hooks/useTargetDashboard';
import { getReadinessClassName, getReadinessLabel } from '@/app/utils/readiness-label';
import { LearningPlanStatus } from '@/app/enums';
import pageStyles from './TargetDashboard.module.scss';
import styles from '@/app/assets/styles/diagnostic/PersonalizedPlan.module.scss';

const cx = classNamesBind.bind(styles);
const pageCx = classNamesBind.bind(pageStyles);

function TargetDashboard() {
  const [searchParams, setSearchParams] = useSearchParamsState();
  const [examTypeId, setExamTypeId] = useState(searchParams.get('examTypeId') || '');

  const {
    examTypes,
    examParts,
    target,
    plans,
    latestMock,
    latestEnhanced,
    isLoading: loading,
    error,
  } = useTargetDashboard(examTypeId);

  useEffect(() => {
    if (!examTypeId && examTypes.length > 0) {
      setExamTypeId(examTypes[0].examTypeId);
    }
  }, [examTypes, examTypeId]);

  const activePlan = useMemo(
    () => (plans || []).find((p) => p.status === LearningPlanStatus.ACTIVE) || null,
    [plans],
  );

  const nextStepTo = useMemo(() => {
    if (activePlan) return `/learning-plans/${activePlan.learningPlanId}`;
    if (latestMock?.userTestId) return `/learning-plans/generate?userTestId=${latestMock.userTestId}`;
    return examTypeId ? `/learning-plans/generate?examTypeId=${examTypeId}` : '/learning-plans/generate';
  }, [activePlan, latestMock, examTypeId]);

  const partNameOf = (id: string) =>
    examParts.find((p) => p.examPartId === id)?.name || id;

  const enhancedMatchesType =
    latestEnhanced && (!latestEnhanced.examTypeId || latestEnhanced.examTypeId === examTypeId);

  const isAchieved = Boolean(target?.achievedAt)
    || (enhancedMatchesType && latestEnhanced?.isTargetMet === true);

  const mockScore = enhancedMatchesType ? latestEnhanced?.totalScore : null;
  const targetScore = target?.targetScore ?? null;

  const scoreProgress = useMemo(() => {
    if (mockScore == null || targetScore == null || targetScore <= 0) {
      return { percent: 0, gap: null, reached: false };
    }
    const percent = Math.min(100, Math.round((mockScore / targetScore) * 100));
    return {
      percent,
      gap: Math.max(0, targetScore - mockScore),
      reached: mockScore >= targetScore,
    };
  }, [mockScore, targetScore]);

  const partChartRows = useMemo<PartChartRow[]>(() => {
    if (!target?.partRequirements?.length) {
      return [];
    }
    return sortPartsByLookup(target.partRequirements, examParts).map((p) => {
      const cur = p.currentScore != null ? Number(p.currentScore) : null;
      const aim = p.requiredPercentage ?? 0;
      const reached = cur != null ? cur >= aim : false;
      return {
        key: p.examPartId,
        name: partNameOf(p.examPartId),
        aim,
        current: cur,
        reached,
      };
    });
  }, [target, examParts]);

  const readinessLevel = enhancedMatchesType ? latestEnhanced?.readinessLevel : null;
  const examTypeName = useMemo(
    () => examTypes.find((et) => et.examTypeId === examTypeId)?.name || '',
    [examTypes, examTypeId],
  );

  return (
    <div className={cx('wrapper')}>
      <TargetPlanTabs active="overview" examTypeId={examTypeId} />
      <div className={cx('headerBar')}>
        <h2 className={cx('title')}>Tổng quan mục tiêu</h2>
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
              <option key={et.examTypeId} value={et.examTypeId}>
                {et.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className={cx('alert', 'alertDanger')}>{error}</div>}
      {loading && <div className={cx('loading')}>Đang tải...</div>}

      {!loading && !target?.hasTarget && examTypeId && (
        <div className={cx('alert', 'alertInfo')}>
          <span>Bạn chưa đặt mục tiêu cho kỳ thi này.</span>
          <ButtonPrime as="link" href={`/my-target?examTypeId=${examTypeId}`} variant="primary" size="sm">
            Đặt mục tiêu
          </ButtonPrime>
        </div>
      )}

      {!loading && target?.hasTarget && (
        <>
          {isAchieved && (
            <div className={pageCx('achievedCard')}>
              <p className={pageCx('achievedCardText')}>
                <strong>Bạn đã đạt mục tiêu {target.targetScore}!</strong>
                {target.achievedAt
                  ? ` Đạt lúc: ${formatDate(target.achievedAt)}.`
                  : ` Bài thi thử gần nhất: ${latestEnhanced?.totalScore} điểm.`}
              </p>
              <ButtonPrime
                as="link"
                href={`/my-target/achieved?examTypeId=${examTypeId}`}
                variant="success"
                size="sm"
              >
                Đặt mục tiêu mới
              </ButtonPrime>
            </div>
          )}

          <div className={cx('statGrid')}>
            <div className={cx('statTile')}>
              <div className={cx('statLabel')}>Mục tiêu điểm</div>
              <div className={cx('statValue')}>{target.targetScore}</div>
              {mockScore != null && (
                <div className={pageCx('scoreProgressBlock')}>
                  <div className={pageCx('scoreProgressMeta')}>
                    <span>
                      Bài gần nhất: <strong>{mockScore}</strong>
                    </span>
                    <span>
                      {scoreProgress.reached
                        ? 'Đã đạt'
                        : scoreProgress.gap != null
                          ? `Còn ${scoreProgress.gap}đ`
                          : ''}
                    </span>
                  </div>
                  <div className={pageCx('scoreProgressBar')}>
                    <div
                      className={classNames(pageCx('scoreProgressFill'), {
                        [pageCx('reached')]: scoreProgress.reached,
                      })}
                      style={{ width: `${scoreProgress.percent}%` }}
                    />
                  </div>
                </div>
              )}
              {!mockScore && (
                <div className={cx('statHint')}>Chưa có mock  làm bài để xem tiến độ.</div>
              )}
            </div>

            <div className={cx('statTile')}>
              <div className={cx('statLabel')}>Độ sẵn sàng bài gần nhất</div>
              <div className={cx('statValue')}>
                {enhancedMatchesType ? `${latestEnhanced?.readinessScore ?? '—'}%` : '—'}
              </div>
              {readinessLevel ? (
                <span
                  className={classNames(
                    pageCx('readinessBadge'),
                    getReadinessClassName(readinessLevel, pageCx),
                  )}
                >
                  {getReadinessLabel(readinessLevel)}
                </span>
              ) : (
                <div className={cx('statHint')}>
                  {enhancedMatchesType ? '' : 'Chưa có bài thi thử cho kỳ thi này'}
                </div>
              )}
            </div>

            <div className={cx('statTile')}>
              <div className={cx('statLabel')}>Lộ trình đang học</div>
              {activePlan ? (
                <>
                  <div className={cx('statValue')}>Lộ trình #{activePlan.planSequence ?? '?'}</div>
                  <div className={cx('statHint')}>
                    Ban đầu {activePlan.baselineReadiness ?? '—'}% ·{' '}
                    {activePlan.passedTasks ?? 0}/{activePlan.totalTasks ?? 0} ải đã pass
                  </div>
                  <div className={pageCx('statTileFooter')}>
                    <ButtonPrime
                      as="link"
                      href={`/learning-plans/${activePlan.learningPlanId}`}
                      variant="primary"
                      size="sm"
                    >
                      Mở lộ trình
                    </ButtonPrime>
                  </div>
                </>
              ) : (
                <>
                  <div className={cx('statHint')}>Chưa có plan đang học.</div>
                  {latestMock?.userTestId && (
                    <div className={pageCx('statTileFooter')}>
                      <ButtonPrime
                        as="link"
                        href={`/learning-plans/generate?userTestId=${latestMock.userTestId}`}
                        variant="primary"
                        size="sm"
                      >
                        Sinh lộ trình
                      </ButtonPrime>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className={classNames(cx('card'), pageCx('partSection'))}>
            <div className={cx('cardHeader')}>% từng Part  hiện tại vs aim</div>
            <div className={cx('cardBody')}>
              <TargetDashboardPartChart rows={partChartRows} />
            </div>
          </div>

        </>
      )}

      {!loading && (
        <MockHistoryPanel examTypeId={examTypeId} examTypeName={examTypeName} />
      )}

      {!loading && (
        <div className={cx('actionBar', 'dashboardFooterActions')}>
          <ButtonPrime as="link" href={nextStepTo} variant="primary" size="lg">
            {activePlan ? 'Vào lộ trình đang học' : 'Lập lộ trình ôn'}
          </ButtonPrime>
          {latestMock?.userTestId && (
            <ButtonPrime
              as="link"
              href={`/tests/result/${latestMock.userTestId}`}
              variant="outline"
              size="lg"
            >
              Xem chẩn đoán bài gần nhất
            </ButtonPrime>
          )}
        </div>
      )}
    </div>
  );
}

export default TargetDashboard;
