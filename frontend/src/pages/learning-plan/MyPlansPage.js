import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import { listPlans } from '~/api/learningPlanApi';
import { getExamTypes } from '~/api/examTypeApi';
import styles from '../PersonalizedPlan.module.scss';

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

function MyPlansPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [examTypes, setExamTypes] = useState([]);
  const [examTypeId, setExamTypeId] = useState(searchParams.get('examTypeId') || '');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getExamTypes().then(setExamTypes).catch(() => {});
  }, []);

  useEffect(() => {
    if (!examTypeId && examTypes.length > 0) {
      setExamTypeId(examTypes[0].examTypeId);
    }
  }, [examTypes, examTypeId]);

  useEffect(() => {
    if (!examTypeId) return;
    setLoading(true);
    setError(null);
    listPlans(examTypeId)
      .then((data) => setPlans(data || []))
      .catch((err) => setError(err?.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [examTypeId]);

  return (
    <div className={cx('wrapper')}>
      <div className={cx('headerBar')}>
        <h2 className={cx('title')}>Kế hoạch học của tôi</h2>
        <div className={cx('actionBar')}>
          <Link to="/learning-plans/generate" className={cx('btn', 'btnPrimary', 'btnSm')}>
            + Sinh plan mới
          </Link>
          <Link
            to={examTypeId ? `/learning-plans/compare?examTypeId=${examTypeId}` : '/learning-plans/compare'}
            className={cx('btn', 'btnOutline', 'btnSm')}
          >
            So sánh plan
          </Link>
        </div>
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
              <option key={et.examTypeId} value={et.examTypeId}>{et.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className={cx('alert', 'alertDanger')}>{error}</div>}
      {loading && <div className={cx('loading')}>Đang tải...</div>}

      {!loading && plans.length === 0 && examTypeId && (
        <div className={cx('alert', 'alertInfo')}>
          <span>Chưa có plan nào cho kỳ thi này.</span>
          <Link to="/learning-plans/generate" className={cx('btn', 'btnPrimary', 'btnSm')}>
            Sinh plan đầu tiên
          </Link>
        </div>
      )}

      {plans.map((p) => (
        <div key={p.learningPlanId} className={cx('planListItem')}>
          <div className={cx('planListMain')}>
            <div className={cx('planListTitle')}>
              Plan #{p.planSequence ?? '?'}
              <span className={cx('badge', STATUS_VARIANT[p.status] || 'badgeMuted')}>
                {STATUS_LABEL[p.status] || p.status}
              </span>
              <code className={cx('code')}>{p.learningPlanId.slice(0, 8)}…</code>
            </div>
            <div className={cx('planListMeta')}>
              Stage <strong>{p.planStage || 'FOUNDATION'}</strong>
              {' · '}Ải <strong>{p.passedTasks ?? 0}/{p.totalTasks ?? 0}</strong>
              {' · '}Readiness <strong>{p.baselineReadiness ?? p.currentReadiness ?? '—'}%</strong>
            </div>
          </div>
          <div className={cx('actionBar')}>
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
          </div>
        </div>
      ))}
    </div>
  );
}

export default MyPlansPage;
