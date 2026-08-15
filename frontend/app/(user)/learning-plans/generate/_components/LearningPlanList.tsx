'use client';

import Link from 'next/link';
import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import classNames from 'classnames/bind';
import { toast } from 'react-toastify';
import { IoSwapHorizontalOutline } from 'react-icons/io5';
import ConfirmModal from '@/app/components/modal/ConfirmModal';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import { useLearningPlanList } from '../_hooks/useLearningPlanList';
import { useDeletePlan } from '../_hooks/useDeletePlan';
import { useSwitchPlan } from '../_hooks/useSwitchPlan';
import { useResyncPlan } from '@/app/hooks/useResyncPlan';
import { formatDateTime24 as formatDate } from '@/app/utils/format-date-time';
import {
  buildResyncMessage,
  planStageLabel,
  planStatusLabel,
  planStatusVariant,
} from '@/app/utils/planLabels';
import styles from '@/app/features/diagnostic/styles/PersonalizedPlan.module.scss';
import { LearningPlanStatus } from '@/app/enums';
import type { PlanListItem } from '../_hooks/useLearningPlanList';

const cx = classNames.bind(styles);

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
      // err any có chủ đích: lỗi Axios, đọc response.data.message (BE không có type lỗi)
      onError: (err: any) => toast.error(err?.response?.data?.message || 'Lỗi khi chuyển lộ trình'),
    });
  }, [switchTarget, switchMutation, reload]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    const planId = deleteTarget.learningPlanId;
    setDeleteTarget(null);
    deleteMutation.mutate(planId, {
      onSuccess: () => reload(),
      // err any có chủ đích: lỗi Axios, đọc response.data.message (BE không có type lỗi)
      onError: (err: any) => toast.error(err?.response?.data?.message || 'Lỗi khi xóa lộ trình'),
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

  const compareHref = currentFilter
    ? `/learning-plans/compare?examTypeId=${currentFilter}`
    : '/learning-plans/compare';

  const countSubtitle = loading
    ? 'Đang tải...'
    : `${plans.length} lộ trình`;

  const listBody = (
    <>
      {examTypes.length > 0 && (
        <div className={cx('filterRow')} style={{ marginBottom: '1.6rem' }}>
          <div className={cx('fieldGroup')}>
            <label className={cx('fieldLabel')}>Lọc theo kỳ thi</label>
            <select
              className={cx('select')}
              value={currentFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
            >
              {allowAllInFilter && <option value="">Tất cả kỳ thi</option>}
              {examTypes.map((et) => (
                <option key={et.examTypeId} value={et.examTypeId}>
                  {et.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {error && <div className={cx('alert', 'alertDanger')}>{error}</div>}
      {loading && <div className={cx('loading')}>Đang tải...</div>}

      {!loading && plans.length === 0 && (emptyMessage || emptyAction) && (
        <div className={cx('alert', 'alertInfo')}>
          <span>{emptyMessage}</span>
          {emptyAction}
        </div>
      )}

      {!loading && plans.map((p) => (
        <div key={p.learningPlanId} className={cx('planListItem')}>
          <div className={cx('planListMain')}>
            <div className={cx('planListTitle')}>
              Lộ trình #{p.planSequence ?? '?'}
              <span className={cx('badge', planStatusVariant(p.status))}>
                {planStatusLabel(p.status)}
              </span>
              {showExamTypeBadge && p.examTypeName && (
                <span className={cx('badge', 'badgeMuted')}>{p.examTypeName}</span>
              )}
              {p.targetOutdated && (
                <span
                  className={cx('badge', 'badgeWarning')}
                  title="Lộ trình sinh theo mục tiêu cũ  cập nhật để áp ngưỡng mục tiêu hiện tại"
                >
                  Mục tiêu cũ
                </span>
              )}
            </div>
            <div className={cx('planListMeta')}>
              Giai đoạn <strong>{planStageLabel(p.planStage)}</strong>
              {' · '}Ải <strong>{p.passedTasks ?? 0}/{p.totalTasks ?? 0}</strong>
              {p.createdAt && (
                <>
                  {' · '}
                  <span className={cx('muted')}>{formatDate(p.createdAt)}</span>
                </>
              )}
            </div>
          </div>
          <div className={cx('actionBar')}>
            {p.targetOutdated && p.status === LearningPlanStatus.ACTIVE && (
              <button
                type="button"
                className={cx('btn', 'btnPrimary', 'btnSm')}
                disabled={resyncing === p.learningPlanId}
                title="Sinh lại từ bài chẩn đoán cũ theo mục tiêu hiện tại, giữ tiến độ ải đã vượt"
                onClick={() => resyncMutation.mutate(p.learningPlanId)}
              >
                {resyncing === p.learningPlanId ? 'Đang cập nhật...' : 'Cập nhật mục tiêu'}
              </button>
            )}
            {p.status !== LearningPlanStatus.ACTIVE && (
              <button
                type="button"
                className={cx('btn', 'btnSuccess', 'btnSm')}
                disabled={switching === p.learningPlanId}
                onClick={() => setSwitchTarget(p)}
              >
                {switching === p.learningPlanId ? 'Đang chuyển...' : 'Đổi kế hoạch'}
              </button>
            )}
            <Link
              href={`/learning-plans/${p.learningPlanId}#chon-ai-hoc`}
              className={cx('btn', 'btnPrimary', 'btnSm')}
            >
              Chọn ải
            </Link>
            <Link
              href={`/learning-plans/${p.learningPlanId}`}
              className={cx('btn', 'btnOutline', 'btnSm')}
            >
              Xem
            </Link>
            <button
              type="button"
              className={cx('btn', 'btnDanger', 'btnSm')}
              disabled={p.status === LearningPlanStatus.ACTIVE || deleting === p.learningPlanId}
              title={p.status === LearningPlanStatus.ACTIVE ? 'Không thể xóa lộ trình đang học' : undefined}
              onClick={() => setDeleteTarget(p)}
            >
              {deleting === p.learningPlanId ? 'Đang xóa...' : 'Xóa'}
            </button>
          </div>
        </div>
      ))}
    </>
  );

  const confirmModals = (
    <>
      <ConfirmModal
        show={Boolean(switchTarget)}
        onClose={() => setSwitchTarget(null)}
        onConfirm={handleSwitchConfirm}
        title="Đổi kế hoạch học"
        icon={IoSwapHorizontalOutline}
        confirmText="Đồng ý chuyển"
        message={
          switchTarget
            ? `Chuyển sang lộ trình #${switchTarget.planSequence ?? '?'}? Lộ trình đang học hiện tại sẽ được lưu lại với trạng thái "Đã thay".`
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
            ? `Bạn có chắc muốn xóa lộ trình #${deleteTarget.planSequence ?? '?'}? Toàn bộ dữ liệu ải và phiên học sẽ bị mất vĩnh viễn.`
            : ''
        }
      />
    </>
  );

  if (!wrapInCard) {
    return (
      <div className={cx('planListSection', className)} style={styleProp}>
        {showHeader && title && (
          <h3 className={cx('sectionTitle')}>{title}</h3>
        )}
        {listBody}
        {confirmModals}
      </div>
    );
  }

  return (
    <section
      className={cx('card', 'planListCard', className)}
      style={styleProp}
    >
      {showHeader && (
        <div className={cx('cardHeader', 'planListCardHeader')}>
          <div>
            <h3 className={cx('sectionTitle', 'planListCardTitle')}>{title}</h3>
            <p className={cx('planListCardCount')}>{countSubtitle}</p>
          </div>
          {(showCompareLink || showRefreshButton) && (
            <div className={cx('actionBar')}>
              {showCompareLink && (
                <Link href={compareHref} className={cx('btn', 'btnOutline', 'btnSm')}>
                  So sánh lộ trình
                </Link>
              )}
              {showRefreshButton && (
                <button
                  type="button"
                  className={cx('btn', 'btnGhost', 'btnSm')}
                  // Giữ nguyên behavior .js cũ (truyền thẳng refetch làm handler) — cast vì chữ ký khác MouseEventHandler
                  onClick={reload as any}
                  disabled={loading}
                >
                  Làm mới
                </button>
              )}
            </div>
          )}
        </div>
      )}
      <div className={cx('cardBody')}>{listBody}</div>
      {confirmModals}
    </section>
  );
});

export default LearningPlanList;
