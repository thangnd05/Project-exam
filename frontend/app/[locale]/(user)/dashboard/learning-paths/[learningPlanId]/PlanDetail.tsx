'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import { toast } from 'react-toastify';
import { useTranslations } from 'next-intl';
import MockStageGuide from './_components/MockStageGuide';
import PlanCongratsModal, {
  congratsSeenKey,
  markCongratsSeen,
} from '@/app/features/learning-plans/PlanCongratsModal/PlanCongratsModal';
import PlanPartTaskList from '@/app/features/learning-plans/PlanPartTaskList/PlanPartTaskList';
import { usePlanDetail } from '@/app/features/learning-plans/hooks/usePlanDetail';
import { useResyncPlan } from '@/app/features/learning-plans/hooks/useResyncPlan';
import {
  buildResyncMessage,
  planStageLabel,
  planStatusLabel,
  taskDisplayName,
  type LearningPlansT,
} from '@/app/features/learning-plans/planLabels';
import routes, { buildExamTypeDetailPath } from '@/app/configs/Routes';
import PageHeader from '@/app/components/PageHeader/PageHeader';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import styles from '@/app/assets/styles/diagnostic/PersonalizedPlan.module.scss';
import { LearningPlanStatus, PlanStage } from '@/app/enums';
import type { PlanResponse, PlanTaskResponse } from '@/app/types';

const cx = classNames.bind(styles);

function findRecommendedTask(plan?: PlanResponse | null): PlanTaskResponse | null {
  if (!plan?.recommendedTaskId) return null;
  return (plan.partGroups || [])
    .flatMap((g) => g.tasks || [])
    .find((t) => t.taskId === plan.recommendedTaskId) || null;
}

function progressCheer(t: LearningPlansT, passed: number, total: number, pct: number) {
  if (total === 0) return t('detail.cheer.waiting');
  if (passed === 0) return t('detail.cheer.firstTask');
  if (pct >= 100) return t('detail.cheer.allDone');
  if (pct >= 75) return t('detail.cheer.almost', { remaining: total - passed });
  if (pct >= 40) return t('detail.cheer.halfway', { remaining: total - passed });
  return t('detail.cheer.momentum', { passed });
}

function PlanDetail() {
  const t = useTranslations('LearningPlans');
  const tc = useTranslations('Common');
  const { learningPlanId } = useParams<{ learningPlanId: string }>();
  const { plan, error, isLoading: loading } = usePlanDetail(learningPlanId);
  const [showCongrats, setShowCongrats] = useState(false);

  const resyncMutation = useResyncPlan({
    onSuccess: (updatedPlan) => {
      toast.success(buildResyncMessage(t, updatedPlan));
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || t('common.resyncError'));
    },
  });

  useEffect(() => {
    if (!loading && window.location.hash === '#chon-ai-hoc') {
      document.getElementById('chon-ai-hoc')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading, plan]);

  useEffect(() => {
    if (!plan || plan.planStage !== PlanStage.MOCK || plan.status === LearningPlanStatus.REPLACED) return;
    try {
      if (localStorage.getItem(congratsSeenKey(plan.learningPlanId))) return;
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đọc cờ "đã xem" trong localStorage (chỉ có ở client) rồi mới hiện modal chúc mừng
    setShowCongrats(true);
  }, [plan]);

  const dismissCongrats = () => {
    setShowCongrats(false);
    markCongratsSeen(learningPlanId);
  };

  if (loading) {
    return <div className={cx('wrapper')}><div className={cx('loading')}>{tc('loading')}</div></div>;
  }
  if (error && !plan) {
    return (
      <div className={cx('wrapper')}>
        <div className={cx('headerBar')}>
          <ButtonPrime as="link" variant="outline" size="sm" href={routes.generatePlan}>
            {t('common.back')}
          </ButtonPrime>
        </div>
        <div className={cx('alert', 'alertDanger')}>{error}</div>
      </div>
    );
  }
  if (!plan) return null;

  const partGroups = plan.partGroups || [];
  const isReplaced = plan.status === LearningPlanStatus.REPLACED;
  const recommendedTask = findRecommendedTask(plan);
  const totalTasks = plan.totalTasks ?? 0;
  const progressPct = totalTasks > 0
    ? Math.round(((plan.passedTasks ?? 0) / totalTasks) * 100)
    : 0;

  const backTo = plan.examTypeId
    ? `/learning-paths/create?examTypeId=${plan.examTypeId}`
    : '/learning-paths/create';

  const passedTasks = plan.passedTasks ?? 0;
  const isMockStage = plan.planStage === PlanStage.MOCK;
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
        <ButtonPrime as="link" variant="outline" size="sm" href={backTo}>
          {t('common.back')}
        </ButtonPrime>
        <div className={cx('headerActions')}>
          <ButtonPrime as="link" variant="ghost" size="sm" href={backTo}>
            {t('detail.allPlans')}
          </ButtonPrime>
          <ButtonPrime as="link" variant="outline" size="sm" href={backTo}>
            {t('common.newPlan')}
          </ButtonPrime>
        </div>
      </div>

      {error && <div className={cx('alert', 'alertDanger')}>{error}</div>}

      {isReplaced && (
        <div className={cx('alert', 'alertWarning')}>
          <span>{t('detail.replaced')}</span>
          {plan.replacedByPlanId && (
            <ButtonPrime as="link" variant="primary" size="sm" href={`/dashboard/learning-paths/${plan.replacedByPlanId}`}>
              {t('detail.viewNewPlan')}
            </ButtonPrime>
          )}
        </div>
      )}

      {!isReplaced && plan.targetOutdated && (
        <div className={cx('alert', 'alertWarning')}>
          <span>
            {t.rich(
              plan.sourceUserTestId ? 'detail.targetOutdatedWithSource' : 'detail.targetOutdatedNoSource',
              { strong: (chunks) => <strong>{chunks}</strong> },
            )}
          </span>
          <ButtonPrime
            variant="primary"
            size="sm"
            disabled={resyncMutation.isPending}
            onClick={() => resyncMutation.mutate(plan.learningPlanId)}
          >
            {resyncMutation.isPending ? t('common.updating') : t('detail.resyncNow')}
          </ButtonPrime>
          <ButtonPrime as="link" variant="outline" size="sm" href={backTo}>
            {t('detail.fromOtherTest')}
          </ButtonPrime>
        </div>
      )}

      <PageHeader
        compact
        label={`${t('common.planName', { sequence: plan.planSequence ?? '?' })} · ${planStatusLabel(t, plan.status)}`}
        title={
          plan.planStage === PlanStage.MOCK
            ? t('detail.titleMock')
            : recommendedTask
              ? t('detail.titleNext', {
                part: recommendedTask.examPartName ?? '',
                task: taskDisplayName(t, recommendedTask),
              })
              : t('detail.titleDefault')
        }
        description={progressCheer(t, passedTasks, totalTasks, progressPct)}
        meta={
          <div className={cx('planHeroBadges')}>
            <span className={cx('planHeroBadge')}>
              {t('detail.stage', { stage: planStageLabel(t, plan.planStage) })}
            </span>
            {plan.targetScore != null && (
              <span className={cx('planHeroBadge')}>{t('detail.target', { score: plan.targetScore })}</span>
            )}
          </div>
        }
        footer={
          <>
            <div className={cx('planHeroProgressLabel')}>
              <span>
                {t.rich('detail.progress', {
                  passed: passedTasks,
                  total: totalTasks,
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </span>
              <strong>{progressPct}%</strong>
            </div>
            <div className={cx('planHeroProgressBar')}>
              <div
                className={cx('planHeroProgressFill')}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </>
        }
      >
        {!isReplaced && isMockStage && (
          <div className={cx('planHeroCtaBox')}>
            <ButtonPrime as="link" variant="ink" size="lg" href={mockTestsTo}>
              {t('common.takeMock')}
            </ButtonPrime>
            <span className={cx('planHeroCtaHint')}>{t('detail.mockCtaHint')}</span>
          </div>
        )}

        {!isReplaced && !isMockStage && recommendedTask && (
          <ButtonPrime
            as="link"
            variant="ink"
            size="lg"
            href={`/dashboard/learning-paths/${plan.learningPlanId}/study?taskId=${recommendedTask.taskId}`}
          >
            {t('detail.enterTask')}
          </ButtonPrime>
        )}
      </PageHeader>

      {!isReplaced && isMockStage && <MockStageGuide plan={plan} />}

      {plan.diagnosisSourcePractice && (
        <div className={cx('alert', 'alertWarning')}>
          <span>
            {t.rich('detail.practiceSource', { strong: (chunks) => <strong>{chunks}</strong> })}
          </span>
          <ButtonPrime as="link" variant="primary" size="sm" href={`/learning-paths/create?examTypeId=${plan.examTypeId}`}>
            {t('common.newPlan')}
          </ButtonPrime>
        </div>
      )}

      {(plan.partsWithoutTasks?.length ?? 0) > 0 && (
        <div className={cx('alert', 'alertWarning')}>
          {t('detail.partsWithoutTasks')}{' '}
          <strong>{plan.partsWithoutTasks!.join(', ')}</strong>
        </div>
      )}

      {!isReplaced && (
        <PlanPartTaskList
          partGroups={partGroups}
          learningPlanId={plan.learningPlanId}
          recommendedTaskId={plan.recommendedTaskId}
          studyAction="link"
          roadmapHeading={{
            title: t('detail.roadmapTitle'),
            tip: t('termTips.task'),
            description: t('detail.roadmapDesc', { parts: partGroups.length, tasks: totalTasks }),
          }}
        />
      )}
    </div>
  );
}

export default PlanDetail;
