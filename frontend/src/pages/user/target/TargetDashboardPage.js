import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import axios from '~/api/axiosClient';
import { getExamTypes } from '~/api/examTypeApi';
import { getExamParts } from '~/api/examPartApi';
import { getUserTarget } from '~/api/userTargetApi';
import { listPlans } from '~/api/learningPlanApi';
import { getEnhancedResult } from '~/api/enhancedResultApi';
import styles from '../../learning-plan/PersonalizedPlan.module.scss';
import { sortByPartOrder, sortPartsByLookup } from '~/utils/partOrder';

const cx = classNames.bind(styles);

function formatDate(s) {
  return s ? new Date(s).toLocaleString('vi-VN', { hour12: false }) : '—';
}

function TargetDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [examTypes, setExamTypes] = useState([]);
  const [examParts, setExamParts] = useState([]);
  const [examTypeId, setExamTypeId] = useState(searchParams.get('examTypeId') || '');

  const [target, setTarget] = useState(null);
  const [plans, setPlans] = useState([]);
  const [latestMock, setLatestMock] = useState(null);
  const [latestEnhanced, setLatestEnhanced] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getExamTypes().then(setExamTypes).catch(() => {});
    getExamParts().then((data) => setExamParts(sortByPartOrder(data))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!examTypeId && examTypes.length > 0) {
      setExamTypeId(examTypes[0].examTypeId);
    }
  }, [examTypes, examTypeId]);

  const loadDashboard = useCallback(async () => {
    if (!examTypeId) return;
    setLoading(true);
    setError(null);
    try {
      const t = await getUserTarget(examTypeId).catch(() => null);
      setTarget(t);

      const ps = await listPlans(examTypeId).catch(() => []);
      setPlans(ps || []);

      const res = await axios.get('/api/user-tests/my');
      const arr = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const completed = arr
        .filter((u) => u.status === 'COMPLETED' && u.finishedAt)
        .filter((u) => !u.examTypeId || u.examTypeId === examTypeId)
        .sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt));
      const latest = completed[0] || null;
      setLatestMock(latest);

      if (latest?.userTestId) {
        try {
          const r = await getEnhancedResult(latest.userTestId);
          setLatestEnhanced(r.data);
        } catch {
          setLatestEnhanced(null);
        }
      } else {
        setLatestEnhanced(null);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [examTypeId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const activePlan = useMemo(
    () => (plans || []).find((p) => p.status === 'ACTIVE') || null,
    [plans],
  );

  const partNameOf = (id) =>
    examParts.find((p) => p.examPartId === id)?.name || id;

  const enhancedMatchesType =
    latestEnhanced && (!latestEnhanced.examTypeId || latestEnhanced.examTypeId === examTypeId);

  const isAchieved = Boolean(target?.achievedAt)
    || (enhancedMatchesType && latestEnhanced?.isTargetMet === true);

  return (
    <div className={cx('wrapper')}>
      <div className={cx('headerBar')}>
        <h2 className={cx('title')}>Tổng quan mục tiêu</h2>
        <div className={cx('actionBar')}>
          <Link to="/my-target" className={cx('btn', 'btnOutline', 'btnSm')}>
            Cài đặt target
          </Link>
          <Link to="/my-target/mocks" className={cx('btn', 'btnOutline', 'btnSm')}>
            Lịch sử Mock
          </Link>
          <Link
            to={examTypeId ? `/learning-plans/compare?examTypeId=${examTypeId}` : '/learning-plans/generate'}
            className={cx('btn', 'btnOutline', 'btnSm')}
          >
            So sánh Plan
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

      {!loading && !target?.hasTarget && examTypeId && (
        <div className={cx('alert', 'alertWarning')}>
          <span>Bạn chưa đặt mục tiêu cho kỳ thi này.</span>
          <Link to={`/my-target?examTypeId=${examTypeId}`} className={cx('btn', 'btnPrimary', 'btnSm')}>
            Đặt mục tiêu
          </Link>
        </div>
      )}

      {!loading && target?.hasTarget && (
        <>
          {isAchieved && (
            <div className={cx('alert', 'alertSuccess')}>
              <span>
                <strong>Bạn đã đạt mục tiêu {target.targetScore}!</strong>{' '}
                {target.achievedAt
                  ? <>Đạt lúc: <strong>{formatDate(target.achievedAt)}</strong>.</>
                  : <>Mock gần nhất: <strong>{latestEnhanced?.totalScore}</strong>.</>}
              </span>
              <Link
                to={`/my-target/achieved?examTypeId=${examTypeId}`}
                className={cx('btn', 'btnSuccess', 'btnSm')}
              >
                Đặt mục tiêu mới
              </Link>
            </div>
          )}

          <div className={cx('statGrid')}>
            <div className={cx('statTile')}>
              <div className={cx('statLabel')}>Mục tiêu điểm</div>
              <div className={cx('statValue')}>{target.targetScore}</div>
              {latestEnhanced?.totalScore != null && enhancedMatchesType && (
                <div className={cx('statHint')}>
                  Mock gần nhất: <strong>{latestEnhanced.totalScore}</strong>
                  {latestEnhanced.totalScore >= target.targetScore
                    ? ' (đạt)'
                    : ` · còn ${target.targetScore - latestEnhanced.totalScore}đ`}
                </div>
              )}
            </div>

            <div className={cx('statTile')}>
              <div className={cx('statLabel')}>Readiness mock gần nhất</div>
              <div className={cx('statValue')}>
                {enhancedMatchesType ? `${latestEnhanced?.readinessScore ?? '—'}%` : '—'}
              </div>
              <div className={cx('statHint')}>
                {enhancedMatchesType
                  ? latestEnhanced?.readinessLevel || ''
                  : 'Chưa có mock cho kỳ thi này'}
              </div>
            </div>

            <div className={cx('statTile')}>
              <div className={cx('statLabel')}>Plan đang học</div>
              {activePlan ? (
                <>
                  <div className={cx('statValue')}>Plan #{activePlan.planSequence ?? '?'}</div>
                  <div className={cx('statHint')}>
                    Baseline {activePlan.baselineReadiness ?? '—'}% ·{' '}
                    {activePlan.passedTasks ?? 0}/{activePlan.totalTasks ?? 0} ải đã pass
                  </div>
                  <Link
                    to={`/learning-plans/${activePlan.learningPlanId}`}
                    className={cx('btn', 'btnPrimary', 'btnSm')}
                    style={{ marginTop: '1rem' }}
                  >
                    Mở plan
                  </Link>
                </>
              ) : (
                <>
                  <div className={cx('statHint')}>Chưa có plan đang học.</div>
                  {latestMock?.userTestId && (
                    <Link
                      to={`/learning-plans/generate?userTestId=${latestMock.userTestId}`}
                      className={cx('btn', 'btnPrimary', 'btnSm')}
                      style={{ marginTop: '1rem' }}
                    >
                      Sinh plan từ mock
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          <div className={cx('card')}>
            <div className={cx('cardHeader')}>% từng Part — hiện tại vs aim</div>
            <div className={cx('tableWrapper')} style={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
              <table className={cx('table')}>
                <thead>
                  <tr>
                    <th>Part</th>
                    <th className={cx('right')}>Aim</th>
                    <th className={cx('right')}>Hiện tại</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {sortPartsByLookup(target.partRequirements || [], examParts).map((p) => {
                    const cur = p.currentScore != null ? Number(p.currentScore) : null;
                    const reached = cur != null && p.requiredPercentage != null
                      ? cur >= p.requiredPercentage
                      : null;
                    return (
                      <tr key={p.examPartId}>
                        <td>{partNameOf(p.examPartId)}</td>
                        <td className={cx('right')}>{p.requiredPercentage}%</td>
                        <td className={cx('right')}>{cur != null ? `${cur.toFixed(2)}%` : '—'}</td>
                        <td>
                          {reached === null ? (
                            <span className={cx('badge', 'badgeMuted')}>Chưa có mock</span>
                          ) : reached ? (
                            <span className={cx('badge', 'badgeSuccess')}>Đạt aim</span>
                          ) : (
                            <span className={cx('badge', 'badgeWarning')}>
                              Còn {(p.requiredPercentage - cur).toFixed(1)}%
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {latestMock && (
            <div className={cx('card')}>
              <div className={cx('cardBody')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div className={cx('statLabel')}>Mock gần nhất</div>
                  <div style={{ fontSize: 'var(--font-size-ssm)' }}>
                    <strong>{formatDate(latestMock.finishedAt)}</strong>
                    {' · '}Score {latestMock.totalScore ?? '—'}
                    {' · '}<code className={cx('code')}>{latestMock.userTestId.slice(0, 8)}…</code>
                  </div>
                </div>
                <div className={cx('actionBar')}>
                  <Link
                    to={`/tests/result/${latestMock.userTestId}`}
                    className={cx('btn', 'btnOutline', 'btnSm')}
                  >
                    Xem chẩn đoán
                  </Link>
                  <Link
                    to={`/learning-plans/generate?userTestId=${latestMock.userTestId}`}
                    className={cx('btn', 'btnOutline', 'btnSm')}
                  >
                    Sinh plan
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className={cx('actionBar')}>
            <Link to={`/next-step?examTypeId=${examTypeId}`} className={cx('btn', 'btnPrimary', 'btnLg')}>
              Tôi nên làm gì tiếp theo?
            </Link>
            <Link to="/my-tests" className={cx('btn', 'btnOutline', 'btnLg')}>
              Tất cả bài đã làm
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default TargetDashboardPage;
