'use client';

import Link from 'next/link';
import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import classNames from 'classnames';
import classNamesBind from 'classnames/bind';
import { toast } from 'react-toastify';
import { IoMapOutline, IoSwapHorizontalOutline } from 'react-icons/io5';
import ConfirmModal from '@/app/components/modal/ConfirmModal';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import ExamPillPicker from '@/app/features/my-target/ExamPillPicker/ExamPillPicker';
import { useLearningPlanList } from '@/app/(guest)/learning-plans/generate/_hooks/useLearningPlanList';
import { useDeletePlan } from '@/app/(guest)/learning-plans/generate/_hooks/useDeletePlan';
import { useSwitchPlan } from '@/app/(guest)/learning-plans/generate/_hooks/useSwitchPlan';
import { useResyncPlan } from '@/app/features/learning-plans/hooks/useResyncPlan';
import { withExam } from '@/app/features/exam-types/hooks/useExamParam';
import { parseCode } from '@/app/(public)/_lib/certificationMeta';
import { formatDateTime24 as formatDate } from '@/app/utils/format-date-time';
import { getApiErrorMessage } from '@/app/utils/apiError';
import {
  buildResyncMessage,
  planStageLabel,
  planStatusLabel,
} from '@/app/features/learning-plans/planLabels';
import uiStyles from '@/app/assets/styles/FlatUi.module.scss';
import styles from './LearningPlanList.module.scss';
import { LearningPlanStatus } from '@/app/enums';
import type { PlanListItem } from '@/app/(guest)/learning-plans/generate/_hooks/useLearningPlanList';

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
    title = 'Lộ trình đã sinh',
    emptyMessage = 'Chưa có lộ trình nào.',
    emptyAction = null,
    refreshKey = 0,
    className,
    style: styleProp,
  },
  ref,
) {
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
      toast.success(buildResyncMessage(newPlan));
      reload();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Không cập nhật được lộ trình');
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
      onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Lỗi khi chuyển lộ trình')),
    });
  }, [switchTarget, switchMutation, reload]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    const planId = deleteTarget.learningPlanId;
    setDeleteTarget(null);
    deleteMutation.mutate(planId, {
      onSuccess: () => reload(),
      onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Lỗi khi xóa lộ trình')),
    });
  }, [deleteTarget, deleteMutation, reload]);

  const handleFilterChange = (value: string) => {
    if (isControlled) {
      onExamTypeIdChange(value);
    } else {
      setFilterExamTypeId(value);
    }
  };

  const currentFilter = isControlled ? examTypeId : filterExamTypeId;

  const compareHref = withExam('/learning-plans/compare', currentFilter, examTypes);

  const renderPlan = (p: PlanListItem) => {
    const isActive = p.status === LearningPlanStatus.ACTIVE;
    const passed = p.passedTasks ?? 0;
    const total = p.totalTasks ?? 0;
    const progress = total > 0 ? Math.round((passed / total) * 100) : 0;

    return (
      <li key={p.learningPlanId} className={cx('item', { active: isActive })}>
        <div className={cx('main')}>
          <div className={cx('titleRow')}>
            <h4 className={cx('title')}>Lộ trình {p.planSequence ?? '?'}</h4>
            <span className={ui('pill', STATUS_TONE[p.status as string])}>
              {planStatusLabel(p.status)}
            </span>
            {showExamTypeBadge && p.examTypeName && (
              <span className={classNames(ui('pill'), cx('examPill'))} title={p.examTypeName}>
                {parseCode(p.examTypeName) || p.examTypeName}
              </span>
            )}
            {p.targetOutdated && (
              <span
                className={ui('pill', 'pillWarning')}
                title="Lộ trình sinh theo mục tiêu cũ, cập nhật để áp ngưỡng mục tiêu hiện tại"
              >
                Mục tiêu cũ
              </span>
            )}
          </div>
          <div className={cx('meta')}>
            <span>{planStageLabel(p.planStage)}</span>
            <span>
              Ải <strong>{passed}/{total}</strong>
            </span>
            {p.createdAt && <span>{formatDate(p.createdAt)}</span>}
          </div>
          <div
            className={cx('progress')}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Đã vượt ${passed}/${total} ải`}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className={cx('actions')}>
          {p.targetOutdated && isActive && (
            <button
              type="button"
              className={ui('btnSecondary', 'btnSm')}
              disabled={resyncing === p.learningPlanId}
              title="Cập nhật ngưỡng vượt ải theo mục tiêu hiện tại, giữ tiến độ ải đã vượt"
              onClick={() => resyncMutation.mutate(p.learningPlanId)}
            >
              {resyncing === p.learningPlanId ? 'Đang cập nhật...' : 'Cập nhật mục tiêu'}
            </button>
          )}
          {!isActive && (
            <button
              type="button"
              className={ui('btnSecondary', 'btnSm')}
              disabled={switching === p.learningPlanId}
              onClick={() => setSwitchTarget(p)}
            >
              {switching === p.learningPlanId ? 'Đang chuyển...' : 'Đổi lộ trình'}
            </button>
          )}
          <Link href={`/learning-plans/${p.learningPlanId}`} className={ui('btnSecondary', 'btnSm')}>
            Xem
          </Link>
          <Link
            href={`/learning-plans/${p.learningPlanId}#chon-ai-hoc`}
            className={ui('btnPrimary', 'btnSm')}
          >
            Chọn ải
          </Link>
          <button
            type="button"
            className={classNames(ui('dangerText'), cx('deleteBtn'))}
            disabled={isActive || deleting === p.learningPlanId}
            title={isActive ? 'Không thể xóa lộ trình đang học' : undefined}
            onClick={() => setDeleteTarget(p)}
          >
            {deleting === p.learningPlanId ? 'Đang xóa...' : 'Xóa'}
          </button>
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
        allLabel={allowAllInFilter ? 'Tất cả' : undefined}
      />

      {error && (
        <div className={ui('notice', 'noticeDanger')}>
          <span>{error}</span>
        </div>
      )}
      {loading && <div className={ui('skeleton')} aria-hidden="true" />}

      {!loading && plans.length === 0 && (emptyMessage || emptyAction) && (
        <div className={ui('notice', 'noticeInfo')}>
          <span>{emptyMessage}</span>
          {emptyAction}
        </div>
      )}

      {!loading && plans.length === 0 && !emptyMessage && !emptyAction && (
        <div className={cx('empty')}>
          <IoMapOutline aria-hidden="true" />
          <span>Chưa có lộ trình nào cho kỳ thi này.</span>
        </div>
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
        title="Đổi lộ trình học"
        icon={IoSwapHorizontalOutline}
        confirmText="Đồng ý chuyển"
        message={
          switchTarget
            ? `Chuyển sang lộ trình ${switchTarget.planSequence ?? '?'}? Lộ trình đang học hiện tại sẽ được lưu lại với trạng thái "Đã thay".`
            : ''
        }
      />
      <ConfirmDeleteModal
        show={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa lộ trình"
        message={
          deleteTarget
            ? `Bạn có chắc muốn xóa lộ trình ${deleteTarget.planSequence ?? '?'}? Toàn bộ dữ liệu ải và phiên học sẽ bị mất vĩnh viễn.`
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
          {loading ? 'Đang tải...' : <>Hiển thị: <strong>{plans.length}</strong> lộ trình</>}
        </span>
      </div>
      {wrapInCard && (showCompareLink || showRefreshButton) && (
        <div className={cx('headActions')}>
          {showCompareLink && (
            <Link href={compareHref} className={ui('btnSecondary', 'btnSm')}>
              So sánh lộ trình
            </Link>
          )}
          {showRefreshButton && (
            <button type="button" className={ui('textBtn')} onClick={() => reload()} disabled={loading}>
              Làm mới
            </button>
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
