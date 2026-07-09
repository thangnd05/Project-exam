import React, { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { IoSwapHorizontalOutline } from 'react-icons/io5';
import { switchPlan, deletePlan } from '~/api/learningPlanApi';
import ConfirmActionModal from '~/shared/ui/modal/ConfirmActionModal';
import ConfirmDeleteModal from '~/shared/ui/modal/ConfirmDeleteModal';
import { useLearningPlanList } from '../hooks/use-learning-plan-list';
import { formatDateTime24 as formatDate } from '~/shared/utils/format-date-time';
import styles from '../styles/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

const STATUS_VARIANT = {
  ACTIVE: 'badgePrimary',
  COMPLETED: 'badgeSuccess',
  REPLACED: 'badgeMuted',
  ABANDONED: 'badgeDanger',
};

const STATUS_LABEL = {
  ACTIVE: 'Đang học',
  COMPLETED: 'Hoàn thành',
  REPLACED: 'Đã thay',
  ABANDONED: 'Đã bỏ',
};

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

  const [switching, setSwitching] = useState(null);
  const [switchTarget, setSwitchTarget] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useImperativeHandle(ref, () => ({ reload }), [reload]);

  const handleSwitchConfirm = useCallback(async () => {
    if (!switchTarget) return;
    const planId = switchTarget.learningPlanId;
    setSwitchTarget(null);
    setSwitching(planId);
    try {
      await switchPlan(planId);
      reload();
    } catch (err) {
      alert(err?.response?.data?.message || 'Lỗi khi chuyển plan');
    } finally {
      setSwitching(null);
    }
  }, [switchTarget, reload]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    const planId = deleteTarget.learningPlanId;
    setDeleteTarget(null);
    setDeleting(planId);
    try {
      await deletePlan(planId);
      reload();
    } catch (err) {
      alert(err?.response?.data?.message || 'Lỗi khi xóa plan');
    } finally {
      setDeleting(null);
    }
  }, [deleteTarget, reload]);

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
    : `${plans.length} plan${currentFilter ? ' (đã lọc)' : ''}`;

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

      {!loading && plans.length === 0 && (
        <div className={cx('alert', 'alertInfo')}>
          <span>{emptyMessage}</span>
          {emptyAction}
        </div>
      )}

      {!loading && plans.map((p) => (
        <div key={p.learningPlanId} className={cx('planListItem')}>
          <div className={cx('planListMain')}>
            <div className={cx('planListTitle')}>
              Plan #{p.planSequence ?? '?'}
              <span className={cx('badge', STATUS_VARIANT[p.status] || 'badgeMuted')}>
                {STATUS_LABEL[p.status] || p.status}
              </span>
              {showExamTypeBadge && p.examTypeName && (
                <span className={cx('badge', 'badgeMuted')}>{p.examTypeName}</span>
              )}
              <code className={cx('code')}>{p.learningPlanId.slice(0, 8)}…</code>
            </div>
            <div className={cx('planListMeta')}>
              Stage <strong>{p.planStage || 'FOUNDATION'}</strong>
              {' · '}Ải <strong>{p.passedTasks ?? 0}/{p.totalTasks ?? 0}</strong>
              {' · '}Readiness <strong>{p.baselineReadiness ?? p.currentReadiness ?? '—'}%</strong>
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
              title={p.status === 'ACTIVE' ? 'Không thể xóa plan đang học' : undefined}
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
            ? `Chuyển sang Plan #${switchTarget.planSequence ?? '?'}? Plan đang học hiện tại sẽ được lưu lại với trạng thái "Đã thay".`
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
            ? `Bạn có chắc muốn xóa Plan #${deleteTarget.planSequence ?? '?'}? Toàn bộ dữ liệu ải và phiên học sẽ bị mất vĩnh viễn.`
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
                  So sánh plan
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
