'use client';

import { useRouter } from '@/app/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import classNames from 'classnames';
import classNamesBind from 'classnames/bind';
import { ArrowRight, Flag, Trophy } from 'lucide-react';
import TargetPlanTabs from '@/app/features/my-target/TargetPlanTabs/TargetPlanTabs';
import ExamPillPicker from '@/app/features/my-target/ExamPillPicker/ExamPillPicker';
import ExamHeading from '@/app/features/my-target/ExamHeading/ExamHeading';
import { sortPartsByLookup } from '@/app/features/exam-types/partOrder';
import { formatDateTime } from '@/app/utils/format-date-time';
import routes, { examGoalCode } from '@/app/configs/Routes';
import { examTypeIdFromParams, goalHref, withExam } from '@/app/features/exam-types/hooks/useExamParam';
import MockHistoryPanel from './_components/MockHistoryPanel';
import TargetDashboardPartChart, { type PartChartRow } from './_components/TargetDashboardPartChart';
import { useTargetDashboard } from '@/app/features/my-target/hooks/useTargetDashboard';
import { getReadinessClassName, getReadinessLabel } from '@/app/features/my-target/readiness-label';
import { LearningPlanStatus } from '@/app/enums';
import pageStyles from './TargetDashboard.module.scss';
import planStyles from '@/app/assets/styles/diagnostic/PersonalizedPlan.module.scss';
import uiStyles from '@/app/assets/styles/FlatUi.module.scss';
import ButtonPrime from '@/app/components/Button/ButtonPrime';

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

type TargetDashboardProps = {
  /** Mã kỳ thi trên URL (/dashboard/goals/aws-saa-c03); không có thì là trang danh sách mục tiêu. */
  examCode?: string;
};

function TargetDashboard({ examCode }: TargetDashboardProps) {
  const t = useTranslations('MyTarget');
  const router = useRouter();
  const searchParams = useSearchParams();
  // Mã kỳ thi chỉ dịch ra id khi danh sách kỳ thi tải xong, nên bắt đầu rỗng rồi chọn ngay khi danh sách về (xem bên dưới).
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

  const examFromCode = examCode ? examTypes.find((et) => examGoalCode(et) === examCode) : undefined;
  // Link cũ /my-target/dashboard?exam=saa-c03 (hoặc ?examTypeId=) được next.config đưa về /dashboard/goals kèm query.
  const legacyExamTypeId = examCode ? '' : examTypeIdFromParams(searchParams, examTypes);

  // Mã trên URL đổi (bấm Back/Forward giữa các kỳ thi) thì chọn lại theo mã mới.
  const [prevExamCode, setPrevExamCode] = useState(examCode);
  if (prevExamCode !== examCode) {
    setPrevExamCode(examCode);
    setExamTypeId(examFromCode?.examTypeId ?? '');
  }

  // Danh sách kỳ thi về thì chọn kỳ thi theo mã trên URL, query cũ hoặc kỳ đầu tiên (điều chỉnh state ngay khi render).
  if (!examTypeId && examTypes.length > 0) {
    setExamTypeId(examFromCode?.examTypeId || legacyExamTypeId || examTypes[0].examTypeId);
  }

  // Mã kỳ thi không tồn tại thì về danh sách mục tiêu; query cũ thì đổi sang URL dạng path.
  useEffect(() => {
    if (examTypes.length === 0) return;
    if (examCode && !examFromCode) {
      router.replace(routes.targetDashboard);
    } else if (legacyExamTypeId) {
      router.replace(goalHref(legacyExamTypeId, examTypes));
    }
  }, [examCode, examFromCode, legacyExamTypeId, examTypes, router]);

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
      <h1 className="visually-hidden">{t('dashboard.title')}</h1>

      <ExamPillPicker
        className={ui('pickerRow')}
        examTypes={examTypes}
        value={examTypeId}
        onChange={(nextId) => {
          setExamTypeId(nextId);
          router.push(goalHref(nextId, examTypes), { scroll: false });
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
          <ButtonPrime as="link" variant="ink" href={withExam(routes.myTarget, examTypeId, examTypes)}>
            {t('dashboard.noTarget.cta')}
          </ButtonPrime>
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
              <ButtonPrime
                as="link"
                variant="ink"
                size="sm"
                href={withExam(routes.targetAchieved, examTypeId, examTypes)}
              >
                {t('dashboard.newTarget')}
              </ButtonPrime>
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
                    <ButtonPrime
                      as="link"
                      variant="ink"
                      size="sm"
                      href={`/dashboard/learning-paths/${activePlan.learningPlanId}`}
                      className={pageCx('statAction')}
                    >
                      {t('dashboard.openPlan')}
                      <ArrowRight size="1em" aria-hidden="true" />
                    </ButtonPrime>
                  </>
                ) : (
                  <>
                    <span className={pageCx('statValue', 'statValueText', 'muted')}>{t('dashboard.none')}</span>
                    <span className={pageCx('statHint')}>{t('dashboard.noActivePlan')}</span>
                    {latestMock?.userTestId && (
                      <ButtonPrime
                        as="link"
                        variant="ink"
                        size="sm"
                        href={`/learning-paths/create?attempt=${latestMock.userTestId}`}
                        className={pageCx('statAction')}
                      >
                        {t('dashboard.generatePlan')}
                        <ArrowRight size="1em" aria-hidden="true" />
                      </ButtonPrime>
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
    </div>
  );
}

export default TargetDashboard;
