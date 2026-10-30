'use client';

import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import classNames from 'classnames';
import classNamesBind from 'classnames/bind';
import { toast } from 'react-toastify';
import { useTranslations } from 'next-intl';
import { ArrowLeftRight, CircleAlert, X } from 'lucide-react';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import ConfirmModal from '@/app/components/modal/ConfirmModal';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import ExamPillPicker from '@/app/features/my-target/ExamPillPicker/ExamPillPicker';
import { useLearningPlanList } from '@/app/[locale]/(guest)/learning-paths/create/_hooks/useLearningPlanList';
import { useDeletePlan } from '@/app/[locale]/(guest)/learning-paths/create/_hooks/useDeletePlan';
import { useSwitchPlan } from '@/app/[locale]/(guest)/learning-paths/create/_hooks/useSwitchPlan';
import { useResyncPlan } from '@/app/features/learning-plans/hooks/useResyncPlan';
import { parseCode } from '@/app/[locale]/(public)/_lib/certificationMeta';
import { formatDateTime } from '@/app/utils/format-date-time';
import { getApiErrorMessage } from '@/app/utils/apiError';
import {
  buildResyncMessage,
  planStageLabel,
  planStatusLabel,
} from '@/app/features/learning-plans/planLabels';
import uiStyles from '@/app/assets/styles/FlatUi.module.scss';
import styles from './LearningPlanList.module.scss';
import { LearningPlanStatus } from '@/app/enums';
import type { PlanListItem } from '@/app/[locale]/(guest)/learning-paths/create/_hooks/useLearningPlanList';
import { MIN_PLANS_TO_COMPARE, planCompareHref } from '@/app/features/learning-plans/planCompare';

const cx = classNamesBind.bind(styles);
const ui = classNamesBind.bind(uiStyles);

const STATUS_TONE: Record<string, string> = {
  [LearningPlanStatus.ACTIVE]: 'pillBrand',
  [LearningPlanStatus.COMPLETED]: 'pillSuccess',
};

export type LearningPlanListHandle = {
  reload: () => void;
};

type LearningPlanListProps = {
  loadAll?: boolean;
  examTypeId?: string;
  onExamTypeIdChange?: (value: string) => void;
  initialExamTypeId?: string;
  allowAllInFilter?: boolean;
  showExamTypeBadge?: boolean;
  wrapInCard?: boolean;
  showHeader?: boolean;
  showCompareLink?: boolean;
  showRefreshButton?: boolean;
  title?: string;
  emptyMessage?: React.ReactNode;
  emptyAction?: React.ReactNode;
  refreshKey?: number;
  className?: string;
  style?: React.CSSProperties;
};

const LearningPlanList = forwardRef<LearningPlanListHandle, LearningPlanListProps>(function LearningPlanList(
  {
    loadAll = false,
    examTypeId,
    onExamTypeIdChange,
    initialExamTypeId = '',
    allowAllInFilter = false,
    showExamTypeBadge = true,
    wrapInCard = true,
    showHeader = true,
    showCompareLink = true,
    showRefreshButton = true,
    title: titleProp,
    emptyMessage: emptyMessageProp,
    emptyAction = null,
    refreshKey = 0,
    className,
    style: styleProp,
  },
  ref,
) {
  const t = useTranslations('LearningPlans');
  const tc = useTranslations('Common');
  const title = titleProp ?? t('common.listTitle');
  const emptyMessage = emptyMessageProp === undefined ? t('planList.empty') : emptyMessageProp;
  const isControlled = examTypeId !== undefined && typeof onExamTypeIdChange === 'function';

  const {
    examTypes,
    plans,
    isLoading: loading,
    error,
    filterExamTypeId,
    setFilterExamTypeId,
    refetch: reload,
  } = useLearningPlanList({
    loadAll,
    examTypeId: isControlled ? examTypeId : undefined,
    initialExamTypeId,
    refreshKey,
  });

  const [switchTarget, setSwitchTarget] = useState<PlanListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PlanListItem | null>(null);

  const deleteMutation = useDeletePlan();
  const deleting = deleteMutation.isPending ? deleteMutation.variables : null;

  const switchMutation = useSwitchPlan();
  const switching = switchMutation.isPending ? switchMutation.variables : null;

  const resyncMutation = useResyncPlan({
    onSuccess: (newPlan) => {
      toast.success(buildResyncMessage(t, newPlan));
      reload();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || t('common.resyncError'));
    },
  });
  const resyncing = resyncMutation.isPending ? resyncMutation.variables : null;

  useImperativeHandle(ref, () => ({ reload }), [reload]);

  const handleSwitchConfirm = useCallback(() => {
    if (!switchTarget) return;
    const planId = switchTarget.learningPlanId;
    setSwitchTarget(null);
    switchMutation.mutate(planId, {
      onSuccess: () => reload(),
      onError: (err: unknown) => toast.error(getApiErrorMessage(err, t('planList.switchError'))),
    });
  }, [switchTarget, switchMutation, reload, t]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    const planId = deleteTarget.learningPlanId;
    setDeleteTarget(null);
    deleteMutation.mutate(planId, {
      onSuccess: () => reload(),
      onError: (err: unknown) => toast.error(getApiErrorMessage(err, t('planList.deleteError'))),
    });
  }, [deleteTarget, deleteMutation, reload, t]);

  const handleFilterChange = (value: string) => {
    if (isControlled) {
      onExamTypeIdChange(value);
    } else {
      setFilterExamTypeId(value);
    }
  };

  const currentFilter = isControlled ? examTypeId : filterExamTypeId;

  const compareHref = planCompareHref(currentFilter, examTypes);
  const canCompare = showCompareLink && plans.length >= MIN_PLANS_TO_COMPARE;

  const renderPlan = (p: PlanListItem) => {
    const isActive = p.status === LearningPlanStatus.ACTIVE;
    const passed = p.passedTasks ?? 0;
    const total = p.totalTasks ?? 0;
    const progress = total > 0 ? Math.round((passed / total) * 100) : 0;

    return (
      <li key={p.learningPlanId} className={cx('item', { active: isActive })}>
        <div className={cx('main')}>
          <div className={cx('titleRow')}>
            <h4 className={cx('title')}>{t('common.planName', { sequence: p.planSequence ?? '?' })}</h4>
            <span className={ui('pill', STATUS_TONE[p.status as string])}>
              {planStatusLabel(t, p.status)}
            </span>
            {showExamTypeBadge && p.examTypeName && (
              <span className={classNames(ui('pill'), cx('examPill'))} title={p.examTypeName}>
                {parseCode(p.examTypeName) || p.examTypeName}
              </span>
            )}
            {p.targetOutdated && (
              <span
                className={ui('pill', 'pillWarning')}
                title={t('planList.targetOutdatedTitle')}
              >
                {t('planList.targetOutdated')}
              </span>
            )}
          </div>
          <div className={cx('meta')}>
            <span>{planStageLabel(t, p.planStage)}</span>
            <span>
              {t.rich('planList.tasksProgress', { passed, total, strong: (chunks) => <strong>{chunks}</strong> })}
            </span>
            {p.createdAt && <span>{formatDateTime(p.createdAt)}</span>}
          </div>
          <div
            className={cx('progress')}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('planList.progressAria', { passed, total })}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className={cx('actions')}>
          {p.targetOutdated && isActive && (
            <ButtonPrime
              variant="soft"
              size="sm"
              type="button"
              disabled={resyncing === p.learningPlanId}
              title={t('planList.resyncTitle')}
              onClick={() => resyncMutation.mutate(p.learningPlanId)}
            >
              {resyncing === p.learningPlanId ? t('common.updating') : t('planList.resync')}
            </ButtonPrime>
          )}
          {!isActive && (
            <ButtonPrime
              variant="soft"
              size="sm"
              type="button"
              disabled={switching === p.learningPlanId}
              onClick={() => setSwitchTarget(p)}
            >
              {switching === p.learningPlanId ? t('planList.switching') : t('planList.switch')}
            </ButtonPrime>
          )}
          <ButtonPrime as="link" variant="soft" size="sm" href={`/dashboard/learning-paths/${p.learningPlanId}`}>
            {t('planList.view')}
          </ButtonPrime>
          <ButtonPrime
            as="link"
            variant="ink"
            size="sm"
            href={`/dashboard/learning-paths/${p.learningPlanId}#chon-ai-hoc`}
          >
            {t('planList.pickTask')}
          </ButtonPrime>
          <ButtonPrime
            variant="dangerGhost"
            size="sm"
            disabled={isActive || deleting === p.learningPlanId}
            title={isActive ? t('planList.cannotDeleteActive') : undefined}
            onClick={() => setDeleteTarget(p)}
          >
            {deleting === p.learningPlanId ? t('planList.deleting') : t('planList.delete')}
          </ButtonPrime>
        </div>
      </li>
    );
  };

  const listBody = (
    <>
      <ExamPillPicker
        className={cx('picker')}
        examTypes={examTypes}
        value={currentFilter}
        onChange={handleFilterChange}
        allLabel={allowAllInFilter ? t('planList.allExams') : undefined}
      />

      {error && (
        <EmptyState
          compact
          tone="danger"
          icon={CircleAlert}
          title={tc('loadErrorTitle')}
          description={error}
          action={
            <ButtonPrime variant="outline" onClick={() => reload()}>
              {tc('error.retry')}
            </ButtonPrime>
          }
        />
      )}
      {loading && <div className={ui('skeleton')} aria-hidden="true" />}

      {!loading && !error && plans.length === 0 && (
        <EmptyState
          compact
          icon={X}
          title={emptyMessage || t('common.noPlansForExam')}
          action={emptyAction}
        />
      )}

      {!loading && plans.length > 0 && <ul className={cx('list')}>{plans.map(renderPlan)}</ul>}
    </>
  );

  const confirmModals = (
    <>
      <ConfirmModal
        show={Boolean(switchTarget)}
        onClose={() => setSwitchTarget(null)}
        onConfirm={handleSwitchConfirm}
        title={t('planList.switchModal.title')}
        icon={ArrowLeftRight}
        confirmText={t('planList.switchModal.confirm')}
        message={
          switchTarget
            ? t('planList.switchModal.message', { sequence: switchTarget.planSequence ?? '?' })
            : ''
        }
      />
      <ConfirmDeleteModal
        show={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={t('planList.deleteModal.title')}
        message={
          deleteTarget
            ? t('planList.deleteModal.message', { sequence: deleteTarget.planSequence ?? '?' })
            : ''
        }
      />
    </>
  );

  const header = showHeader && (
    <div className={ui('cardHead')}>
      <div className={cx('headText')}>
        <h3 className={ui('cardTitle')}>{title}</h3>
        <span className={ui('cardMeta')}>
          {loading
            ? tc('loading')
            : t.rich('planList.count', { count: plans.length, strong: (chunks) => <strong>{chunks}</strong> })}
        </span>
      </div>
      {wrapInCard && (canCompare || showRefreshButton) && (
        <div className={cx('headActions')}>
          {canCompare && (
            <ButtonPrime as="link" variant="soft" size="sm" href={compareHref}>
              {t('planList.compare')}
            </ButtonPrime>
          )}
          {showRefreshButton && (
            <ButtonPrime variant="link" size="sm" onClick={() => reload()} disabled={loading}>
              {t('planList.refresh')}
            </ButtonPrime>
          )}
        </div>
      )}
    </div>
  );

  if (!wrapInCard) {
    return (
      <div className={classNames(cx('section'), className)} style={styleProp}>
        {header}
        {listBody}
        {confirmModals}
      </div>
    );
  }

  return (
    <section className={classNames(ui('card'), className)} style={styleProp}>
      {header}
      {listBody}
      {confirmModals}
    </section>
  );
});

export default LearningPlanList;
