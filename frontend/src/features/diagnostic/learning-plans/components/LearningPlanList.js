import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { toast } from 'react-toastify';
import { IoSwapHorizontalOutline } from 'react-icons/io5';
import ConfirmActionModal from '~/shared/ui/modal/ConfirmActionModal';
import ConfirmDeleteModal from '~/shared/ui/modal/ConfirmDeleteModal';
import { useLearningPlanList } from '~/features/diagnostic/learning-plans/hooks/useLearningPlanList';
import { useDeletePlan } from '~/features/diagnostic/learning-plans/hooks/useDeletePlan';
import { useSwitchPlan } from '~/features/diagnostic/learning-plans/hooks/useSwitchPlan';
import { formatDateTime24 as formatDate } from '~/shared/utils/format-date-time';
import { planStageLabel, planStatusLabel, planStatusVariant } from '../planLabels';
import styles from '~/features/diagnostic/styles/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

const LearningPlanList = forwardRef(function LearningPlanList(
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
    loading,
    error,
    filterExamTypeId,
    setFilterExamTypeId,
    reload,
  } = useLearningPlanList({
    loadAll,
    examTypeId: isControlled ? examTypeId : undefined,
    initialExamTypeId,
    refreshKey,
  });

  const [switchTarget, setSwitchTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const deleteMutation = useDeletePlan();
  const deleting = deleteMutation.isPending ? deleteMutation.variables : null;

  const switchMutation = useSwitchPlan();
  const switching = switchMutation.isPending ? switchMutation.variables : null;

  useImperativeHandle(ref, () => ({ reload }), [reload]);

  const handleSwitchConfirm = useCallback(() => {
    if (!switchTarget) return;
    const planId = switchTarget.learningPlanId;
    setSwitchTarget(null);
    switchMutation.mutate(planId, {
      onSuccess: () => reload(),
      onError: (err) => toast.error(err?.response?.data?.message || 'Lỗi khi chuyển lộ trình'),
    });
  }, [switchTarget, switchMutation, reload]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    const planId = deleteTarget.learningPlanId;
    setDeleteTarget(null);
    deleteMutation.mutate(planId, {
      onSuccess: () => reload(),
      onError: (err) => toast.error(err?.response?.data?.message || 'Lỗi khi xóa lộ trình'),
    });
  }, [deleteTarget, deleteMutation, reload]);

  const handleFilterChange = (value) => {
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
            {p.status !== 'ACTIVE' && (
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
              to={`/learning-plans/${p.learningPlanId}#chon-ai-hoc`}
              className={cx('btn', 'btnPrimary', 'btnSm')}
            >
              Chọn ải
            </Link>
            <Link
              to={`/learning-plans/${p.learningPlanId}`}
              className={cx('btn', 'btnOutline', 'btnSm')}
            >
              Xem
            </Link>
            <button
              type="button"
              className={cx('btn', 'btnDanger', 'btnSm')}
              disabled={p.status === 'ACTIVE' || deleting === p.learningPlanId}
              title={p.status === 'ACTIVE' ? 'Không thể xóa lộ trình đang học' : undefined}
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
      <ConfirmActionModal
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
                <Link to={compareHref} className={cx('btn', 'btnOutline', 'btnSm')}>
                  So sánh lộ trình
                </Link>
              )}
              {showRefreshButton && (
                <button
                  type="button"
                  className={cx('btn', 'btnGhost', 'btnSm')}
                  onClick={reload}
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
