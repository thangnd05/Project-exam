'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import classNames from 'classnames';
import classNamesBind from 'classnames/bind';
import { FiArrowRight } from 'react-icons/fi';
import { IoFlagOutline, IoTrophyOutline } from 'react-icons/io5';
import TargetPlanTabs from '@/app/features/my-target/TargetPlanTabs/TargetPlanTabs';
import ExamPillPicker from '@/app/features/my-target/ExamPillPicker/ExamPillPicker';
import ExamHeading from '@/app/features/my-target/ExamHeading/ExamHeading';
import { sortPartsByLookup } from '@/app/features/exam-types/partOrder';
import { formatDateTime24 as formatDate } from '@/app/utils/format-date-time';
import { useSearchParamsState } from '@/app/hooks/useSearchParamsState';
import {
  examTypeIdFromParams,
  setExamParam,
  useNormalizeExamParam,
  withExam,
} from '@/app/features/exam-types/hooks/useExamParam';
import MockHistoryPanel from './_components/MockHistoryPanel';
import TargetDashboardPartChart, { type PartChartRow } from './_components/TargetDashboardPartChart';
import { useTargetDashboard } from '@/app/features/my-target/hooks/useTargetDashboard';
import { getReadinessClassName, getReadinessLabel } from '@/app/features/my-target/readiness-label';
import { LearningPlanStatus } from '@/app/enums';
import pageStyles from './TargetDashboard.module.scss';
import planStyles from '@/app/assets/styles/diagnostic/PersonalizedPlan.module.scss';
import uiStyles from '@/app/assets/styles/FlatUi.module.scss';

const planCx = classNamesBind.bind(planStyles);
const pageCx = classNamesBind.bind(pageStyles);
const ui = classNamesBind.bind(uiStyles);

// getReadinessClassName trả về khoá mức sẵn sàng; đổi sang tông nhãn của khuôn chung.
const READINESS_TONE: Record<string, string> = {
  readinessReady: 'pillSuccess',
  readinessAlmost: 'pillBrand',
  readinessNeeds: 'pillWarning',
  readinessNotReady: 'pillDanger',
};

function TargetDashboard() {
  const [searchParams, setSearchParams] = useSearchParamsState();
  // ?exam=<slug> chỉ dịch ra id khi danh sách kỳ thi tải xong, nên bắt đầu rỗng rồi chọn ngay khi danh sách về (xem bên dưới).
  const [examTypeId, setExamTypeId] = useState('');

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

  useNormalizeExamParam(examTypes);

  // Danh sách kỳ thi về thì chọn kỳ thi theo ?exam= hoặc kỳ đầu tiên (điều chỉnh state ngay khi render).
  if (!examTypeId && examTypes.length > 0) {
    setExamTypeId(examTypeIdFromParams(searchParams, examTypes) || examTypes[0].examTypeId);
  }

  const activePlan = useMemo(
    () => (plans || []).find((p) => p.status === LearningPlanStatus.ACTIVE) || null,
    [plans],
  );


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
    const partNameOf = (id: string) =>
      examParts.find((p) => p.examPartId === id)?.name || id;
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
  const selectedExamType = useMemo(
    () => examTypes.find((et) => et.examTypeId === examTypeId),
    [examTypes, examTypeId],
  );
  const examTypeName = selectedExamType?.name || '';

  return (
    <div className={classNames(planCx('wrapper'), ui('pageRoot'))}>
      <TargetPlanTabs active="overview" examTypeId={examTypeId} examTypes={examTypes} />
      <header className={ui('pageHead')}>
        <h1 className={ui('pageTitle')}>Tổng quan mục tiêu</h1>
        <p className={ui('pageSubtitle')}>
          Bài thi thử gần nhất so với mục tiêu, lộ trình đang học và % đúng từng phần thi.
        </p>
      </header>

      <ExamPillPicker
        className={ui('pickerRow')}
        examTypes={examTypes}
        value={examTypeId}
        onChange={(nextId) => {
          setExamTypeId(nextId);
          setSearchParams(setExamParam(new URLSearchParams(), nextId, examTypes));
        }}
      />

      {error && (
        <div className={ui('notice', 'noticeDanger')}>
          <span>{error}</span>
        </div>
      )}
      {loading && <div className={ui('skeleton')} aria-hidden="true" />}

      {!loading && !target?.hasTarget && examTypeId && (
        <div className={ui('empty')}>
          <IoFlagOutline className={ui('emptyIcon')} aria-hidden="true" />
          <h2>Chưa đặt mục tiêu cho kỳ thi này</h2>
          <p>Đặt mức điểm muốn đạt để xem tiến độ từng phần và sinh lộ trình phù hợp.</p>
          <Link href={withExam('/my-target', examTypeId, examTypes)} className={ui('btnPrimary')}>
            Đặt mục tiêu
          </Link>
        </div>
      )}

      {!loading && target?.hasTarget && (
        <>
          {isAchieved && (
            <div className={classNames(ui('notice', 'noticeSuccess'), pageCx('achieved'))}>
              <IoTrophyOutline className={pageCx('achievedIcon')} aria-hidden="true" />
              <span>
                <strong>Bạn đã đạt mục tiêu {target.targetScore}!</strong>
                {target.achievedAt
                  ? ` Đạt lúc ${formatDate(target.achievedAt)}.`
                  : ` Bài thi thử gần nhất: ${latestEnhanced?.totalScore} điểm.`}
              </span>
              <Link
                href={withExam('/my-target/achieved', examTypeId, examTypes)}
                className={ui('btnPrimary', 'btnSm')}
              >
                Đặt mục tiêu mới
              </Link>
            </div>
          )}

          <section className={ui('card')} aria-labelledby="overview-exam-title">
            <ExamHeading
              exam={selectedExamType}
              id="overview-exam-title"
              className={pageCx('examHead')}
            />

            <div className={pageCx('stats')}>
              <div className={pageCx('stat')}>
                <span className={ui('eyebrow')}>Mục tiêu điểm</span>
                <span className={pageCx('statValue')}>{target.targetScore}</span>
                {mockScore != null ? (
                  <>
                    <div className={pageCx('scoreBar')}>
                      <span
                        className={pageCx({ reached: scoreProgress.reached })}
                        style={{ width: `${scoreProgress.percent}%` }}
                      />
                    </div>
                    <span className={pageCx('statMeta')}>
                      Gần nhất <strong>{mockScore}</strong>
                      {' · '}
                      {scoreProgress.reached
                        ? 'đã đạt'
                        : scoreProgress.gap != null
                          ? `còn ${scoreProgress.gap}đ`
                          : ''}
                    </span>
                  </>
                ) : (
                  <span className={pageCx('statHint')}>
                    Chưa có bài thi thử nào, làm bài để xem tiến độ.
                  </span>
                )}
              </div>

              <div className={pageCx('stat')}>
                <span className={ui('eyebrow')}>Độ sẵn sàng</span>
                <span className={pageCx('statValue')}>
                  {enhancedMatchesType ? `${latestEnhanced?.readinessScore ?? '-'}%` : '—'}
                </span>
                {readinessLevel ? (
                  <span
                    className={classNames(
                      pageCx('statPill'),
                      getReadinessClassName(readinessLevel, (key) => ui('pill', READINESS_TONE[key])),
                    )}
                  >
                    {getReadinessLabel(readinessLevel)}
                  </span>
                ) : (
                  <span className={pageCx('statHint')}>
                    {enhancedMatchesType ? '' : 'Chưa có bài thi thử cho kỳ thi này.'}
                  </span>
                )}
              </div>

              <div className={pageCx('stat')}>
                <span className={ui('eyebrow')}>Lộ trình đang học</span>
                {activePlan ? (
                  <>
                    <span className={pageCx('statValue', 'statValueText')}>
                      Lộ trình {activePlan.planSequence ?? '?'}
                    </span>
                    <span className={pageCx('statMeta')}>
                      {activePlan.baselineReadiness != null
                        ? `Ban đầu ${activePlan.baselineReadiness}%`
                        : 'Theo chương trình học'}
                      {' · '}
                      <strong>
                        {activePlan.passedTasks ?? 0}/{activePlan.totalTasks ?? 0}
                      </strong>{' '}
                      ải
                    </span>
                    <Link
                      href={`/learning-plans/${activePlan.learningPlanId}`}
                      className={classNames(ui('btnPrimary', 'btnSm'), pageCx('statAction'))}
                    >
                      Mở lộ trình
                      <FiArrowRight aria-hidden="true" />
                    </Link>
                  </>
                ) : (
                  <>
                    <span className={pageCx('statValue', 'statValueText', 'muted')}>Chưa có</span>
                    <span className={pageCx('statHint')}>Chưa có lộ trình đang học.</span>
                    {latestMock?.userTestId && (
                      <Link
                        href={`/learning-plans/generate?userTestId=${latestMock.userTestId}`}
                        className={classNames(ui('btnPrimary', 'btnSm'), pageCx('statAction'))}
                      >
                        Sinh lộ trình
                        <FiArrowRight aria-hidden="true" />
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>

          <section className={ui('card')} aria-labelledby="overview-parts-title">
            <div className={ui('cardHead')}>
              <h3 id="overview-parts-title" className={ui('cardTitle')}>
                % đúng từng phần
              </h3>
              <span className={ui('cardMeta')}>hiện tại so với mục tiêu</span>
            </div>
            <TargetDashboardPartChart rows={partChartRows} />
          </section>
        </>
      )}

      {!loading && (
        <MockHistoryPanel
          examTypeId={examTypeId}
          examTypeName={examTypeName}
          scaleSource={selectedExamType}
        />
      )}
    </div>
  );
}

export default TargetDashboard;
