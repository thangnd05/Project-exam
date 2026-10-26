'use client';

import Link from '@/app/i18n/navigation';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import classNames from 'classnames';
import classNamesBind from 'classnames/bind';
import { ArrowRight, Flag, Trophy } from 'lucide-react';
import TargetPlanTabs from '@/app/features/my-target/TargetPlanTabs/TargetPlanTabs';
import ExamPillPicker from '@/app/features/my-target/ExamPillPicker/ExamPillPicker';
import ExamHeading from '@/app/features/my-target/ExamHeading/ExamHeading';
import { sortPartsByLookup } from '@/app/features/exam-types/partOrder';
import { formatDateTime } from '@/app/utils/format-date-time';
import { useSearchParamsState } from '@/app/hooks/useSearchParamsState';
import {
  examTypeIdFromParams,
  setExamParam,
  useNormalizeExamParam,
  withExam,
} from '@/app/features/exam-types/hooks/useExamParam';
import MockHistoryPanel from './_components/MockHistoryPanel';
import PlanComparisonSection from './_components/PlanComparisonSection';
import TargetDashboardPartChart, { type PartChartRow } from './_components/TargetDashboardPartChart';
import { useTargetDashboard } from '@/app/features/my-target/hooks/useTargetDashboard';
import { getReadinessClassName, getReadinessLabel } from '@/app/features/my-target/readiness-label';
import { LearningPlanStatus } from '@/app/enums';
import pageStyles from './TargetDashboard.module.scss';
import planStyles from '@/app/assets/styles/diagnostic/PersonalizedPlan.module.scss';
import uiStyles from '@/app/assets/styles/FlatUi.module.scss';
import PageHeader from '@/app/components/PageHeader/PageHeader';

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
  const t = useTranslations('MyTarget');
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
      <PageHeader title={t('dashboard.title')} description={t('dashboard.subtitle')} />

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
          <Flag size="1em" className={ui('emptyIcon')} aria-hidden="true" />
          <h2>{t('dashboard.noTarget.title')}</h2>
          <p>{t('dashboard.noTarget.description')}</p>
          <Link href={withExam('/my-target', examTypeId, examTypes)} className={ui('btnPrimary')}>
            {t('dashboard.noTarget.cta')}
          </Link>
        </div>
      )}

      {!loading && target?.hasTarget && (
        <>
          {isAchieved && (
            <div className={classNames(ui('notice', 'noticeSuccess'), pageCx('achieved'))}>
              <Trophy size="1em" className={pageCx('achievedIcon')} aria-hidden="true" />
              <span>
                <strong>{t('dashboard.achievedTitle', { score: target.targetScore ?? '' })}</strong>
                {' '}
                {target.achievedAt
                  ? t('dashboard.achievedAt', { date: formatDateTime(target.achievedAt) })
                  : t('dashboard.latestMockScore', { score: latestEnhanced?.totalScore ?? 0 })}
              </span>
              <Link
                href={withExam('/my-target/achieved', examTypeId, examTypes)}
                className={ui('btnPrimary', 'btnSm')}
              >
                {t('dashboard.newTarget')}
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
                <span className={ui('eyebrow')}>{t('dashboard.targetScore')}</span>
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
                      {t.rich('dashboard.latest', {
                        score: mockScore,
                        strong: (chunks) => <strong>{chunks}</strong>,
                      })}
                      {' · '}
                      {scoreProgress.reached
                        ? t('dashboard.reached')
                        : scoreProgress.gap != null
                          ? t('dashboard.gap', { gap: scoreProgress.gap })
                          : ''}
                    </span>
                  </>
                ) : (
                  <span className={pageCx('statHint')}>
                    {t('dashboard.noMock')}
                  </span>
                )}
              </div>

              <div className={pageCx('stat')}>
                <span className={ui('eyebrow')}>{t('dashboard.readiness')}</span>
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
                    {getReadinessLabel(readinessLevel, t)}
                  </span>
                ) : (
                  <span className={pageCx('statHint')}>
                    {enhancedMatchesType ? '' : t('dashboard.noMockForExam')}
                  </span>
                )}
              </div>

              <div className={pageCx('stat')}>
                <span className={ui('eyebrow')}>{t('dashboard.activePlan')}</span>
                {activePlan ? (
                  <>
                    <span className={pageCx('statValue', 'statValueText')}>
                      {t('dashboard.planName', { seq: activePlan.planSequence ?? '?' })}
                    </span>
                    <span className={pageCx('statMeta')}>
                      {activePlan.baselineReadiness != null
                        ? t('dashboard.baseline', { pct: activePlan.baselineReadiness })
                        : t('dashboard.byCurriculum')}
                      {' · '}
                      {t.rich('dashboard.stages', {
                        passed: activePlan.passedTasks ?? 0,
                        total: activePlan.totalTasks ?? 0,
                        strong: (chunks) => <strong>{chunks}</strong>,
                      })}
                    </span>
                    <Link
                      href={`/learning-plans/${activePlan.learningPlanId}`}
                      className={classNames(ui('btnPrimary', 'btnSm'), pageCx('statAction'))}
                    >
                      {t('dashboard.openPlan')}
                      <ArrowRight size="1em" aria-hidden="true" />
                    </Link>
                  </>
                ) : (
                  <>
                    <span className={pageCx('statValue', 'statValueText', 'muted')}>{t('dashboard.none')}</span>
                    <span className={pageCx('statHint')}>{t('dashboard.noActivePlan')}</span>
                    {latestMock?.userTestId && (
                      <Link
                        href={`/learning-plans/generate?userTestId=${latestMock.userTestId}`}
                        className={classNames(ui('btnPrimary', 'btnSm'), pageCx('statAction'))}
                      >
                        {t('dashboard.generatePlan')}
                        <ArrowRight size="1em" aria-hidden="true" />
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
                {t('dashboard.parts.title')}
              </h3>
              <span className={ui('cardMeta')}>{t('dashboard.parts.meta')}</span>
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

      {!loading && <PlanComparisonSection plans={plans || []} examTypeName={examTypeName} />}
    </div>
  );
}

export default TargetDashboard;
