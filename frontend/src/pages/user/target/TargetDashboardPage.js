import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import axios from '~/api/axiosClient';
import { getExamTypes } from '~/api/examTypeApi';
import { getExamParts } from '~/api/examPartApi';
import { getUserTarget } from '~/api/userTargetApi';
import { listPlans } from '~/api/learningPlanApi';
import { getEnhancedResult } from '~/api/enhancedResultApi';
import { sortByPartOrder, sortPartsByLookup } from '~/utils/partOrder';
import TargetDashboardMockSparkline from './components/TargetDashboardMockSparkline';
import TargetDashboardPartChart from './components/TargetDashboardPartChart';
import { getReadinessClassName, getReadinessLabel } from './utils/readiness-label';
import pageStyles from './TargetDashboardPage.module.scss';
import styles from '../../learning-plan/styles/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);
const pageCx = classNames.bind(pageStyles);

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
  const [recentMocks, setRecentMocks] = useState([]);
  const [latestEnhanced, setLatestEnhanced] = useState(null);
  const [showPartTable, setShowPartTable] = useState(true);

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
      const arr = Array.isArray(res.data) ? res.data : res.data?.data || [];
      const completed = arr
        .filter((u) => u.status === 'COMPLETED' && u.finishedAt)
        .filter((u) => !u.examTypeId || u.examTypeId === examTypeId)
        .sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt));
      setLatestMock(completed[0] || null);
      setRecentMocks(completed.slice(0, 5));

      if (completed[0]?.userTestId) {
        try {
          const r = await getEnhancedResult(completed[0].userTestId);
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

  const partChartRows = useMemo(() => {
    if (!target?.partRequirements?.length) {
      return [];
    }
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

  const mockSparklineData = useMemo(
    () =>
      [...recentMocks]
        .reverse()
        .map((t) => ({
          label: new Date(t.finishedAt).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
          }),
          score: t.totalScore ?? 0,
        })),
    [recentMocks],
  );

  const readinessLevel = enhancedMatchesType ? latestEnhanced?.readinessLevel : null;

  return (
    <div className={cx('wrapper')}>
      <div className={cx('headerBar')}>
        <h2 className={cx('title')}>Tổng quan mục tiêu</h2>
        <div className={cx('actionBar')}>
          <Link to="/my-target" className={cx('btn', 'btnOutline', 'btnSm')}>
            Cài đặt target
          </Link>
          <Link
            to={examTypeId ? `/my-target/mocks?examTypeId=${examTypeId}` : '/my-target/mocks'}
            className={cx('btn', 'btnOutline', 'btnSm')}
          >
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
              <option key={et.examTypeId} value={et.examTypeId}>
                {et.name}
              </option>
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
            <div className={pageCx('achievedCard')}>
              <p className={pageCx('achievedCardText')}>
                <strong>Bạn đã đạt mục tiêu {target.targetScore}!</strong>
                {target.achievedAt
                  ? ` Đạt lúc: ${formatDate(target.achievedAt)}.`
                  : ` Mock gần nhất: ${latestEnhanced?.totalScore} điểm.`}
              </p>
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
              {mockScore != null && (
                <div className={pageCx('scoreProgressBlock')}>
                  <div className={pageCx('scoreProgressMeta')}>
                    <span>
                      Mock gần nhất: <strong>{mockScore}</strong>
                    </span>
                    <span>
                      {scoreProgress.reached
                        ? 'Đã đạt'
                        : scoreProgress.gap != null
                          ? `Còn ${scoreProgress.gap}đ`
                          : ''}
                    </span>
                  </div>
                  <div className={pageCx('scoreProgressBar')}>
                    <div
                      className={classNames(pageCx('scoreProgressFill'), {
                        [pageCx('reached')]: scoreProgress.reached,
                      })}
                      style={{ width: `${scoreProgress.percent}%` }}
                    />
                  </div>
                </div>
              )}
              {!mockScore && (
                <div className={cx('statHint')}>Chưa có mock — làm bài để xem tiến độ.</div>
              )}
            </div>

            <div className={cx('statTile')}>
              <div className={cx('statLabel')}>Readiness mock gần nhất</div>
              <div className={cx('statValue')}>
                {enhancedMatchesType ? `${latestEnhanced?.readinessScore ?? '—'}%` : '—'}
              </div>
              {readinessLevel ? (
                <span
                  className={classNames(
                    pageCx('readinessBadge'),
                    getReadinessClassName(readinessLevel, pageCx),
                  )}
                >
                  {getReadinessLabel(readinessLevel)}
                </span>
              ) : (
                <div className={cx('statHint')}>
                  {enhancedMatchesType ? '' : 'Chưa có mock cho kỳ thi này'}
                </div>
              )}
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
                  <div className={pageCx('statTileFooter')}>
                    <Link
                      to={`/learning-plans/${activePlan.learningPlanId}`}
                      className={cx('btn', 'btnPrimary', 'btnSm')}
                    >
                      Mở plan
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className={cx('statHint')}>Chưa có plan đang học.</div>
                  {latestMock?.userTestId && (
                    <div className={pageCx('statTileFooter')}>
                      <Link
                        to={`/learning-plans/generate?userTestId=${latestMock.userTestId}`}
                        className={cx('btn', 'btnPrimary', 'btnSm')}
                      >
                        Sinh plan từ mock
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {mockSparklineData.length >= 2 && (
            <TargetDashboardMockSparkline
              data={mockSparklineData}
              examTypeId={examTypeId}
              targetScore={targetScore}
            />
          )}

          <div className={classNames(cx('card'), pageCx('partSection'))}>
            <div className={cx('cardHeader')}>% từng Part — hiện tại vs aim</div>
            <div className={cx('cardBody')}>
              <TargetDashboardPartChart rows={partChartRows} />
              <button
                type="button"
                className={classNames(cx('btn', 'btnGhost', 'btnSm'), pageCx('partTableToggle'))}
                onClick={() => setShowPartTable((v) => !v)}
              >
                {showPartTable ? 'Ẩn bảng chi tiết' : 'Xem bảng chi tiết'}
              </button>
              {showPartTable && (
                <div className={pageCx('partTableWrapper')}>
                  <table className={pageCx('partTable')}>
                    <thead>
                      <tr>
                        <th>Part</th>
                        <th>Aim</th>
                        <th>Hiện tại</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partChartRows.map((row) => (
                        <tr key={row.key}>
                          <td className={pageCx('partTableName')}>{row.name}</td>
                          <td className={pageCx('partTableNum')}>{row.aim}%</td>
                          <td className={pageCx('partTableNum')}>
                            {row.current != null ? `${row.current.toFixed(1)}%` : '—'}
                          </td>
                          <td className={pageCx('partTableStatus')}>
                            {row.current == null ? (
                              <span className={pageCx('partCompareBadge', 'muted')}>Chưa có mock</span>
                            ) : row.reached ? (
                              <span className={pageCx('partCompareBadge', 'ok')}>Đạt aim</span>
                            ) : (
                              <span className={pageCx('partCompareBadge', 'gap')}>
                                Còn {(row.aim - row.current).toFixed(1)}%
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {latestMock && (
            <div className={cx('card')}>
              <div
                className={cx('cardBody')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div className={cx('statLabel')}>Mock gần nhất</div>
                  <div style={{ fontSize: 'var(--font-size-ssm)' }}>
                    <strong>{formatDate(latestMock.finishedAt)}</strong>
                    {' · '}Score {latestMock.totalScore ?? '—'}
                    {' · '}
                    <code className={cx('code')}>{latestMock.userTestId.slice(0, 8)}…</code>
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
            <Link
              to={examTypeId ? `/my-target/mocks?examTypeId=${examTypeId}` : '/my-target/mocks'}
              className={cx('btn', 'btnOutline', 'btnLg')}
            >
              Tất cả bài đã làm
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default TargetDashboardPage;
