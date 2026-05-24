import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import axios from '~/api/axiosClient';
import { getExamTypes } from '~/api/examTypeApi';
import { getUserTarget } from '~/api/userTargetApi';
import { getEnhancedResult } from '~/api/enhancedResultApi';
import styles from '../../learning-plan/styles/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

function formatDate(s) {
  return s ? new Date(s).toLocaleString('vi-VN', { hour12: false }) : '—';
}

function suggestNextTarget(current) {
  if (current == null) return null;
  const step = 50;
  const next = Math.min(990, Math.round((current + step) / 10) * 10);
  return next > current ? next : current + 10;
}

function TargetAchievedPage() {
  const [searchParams] = useSearchParams();
  const [examTypes, setExamTypes] = useState([]);
  const [examTypeId, setExamTypeId] = useState(searchParams.get('examTypeId') || '');

  const [target, setTarget] = useState(null);
  const [latestMock, setLatestMock] = useState(null);
  const [enhanced, setEnhanced] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getExamTypes().then(setExamTypes).catch(() => {});
  }, []);

  useEffect(() => {
    if (!examTypeId && examTypes.length > 0) setExamTypeId(examTypes[0].examTypeId);
  }, [examTypes, examTypeId]);

  useEffect(() => {
    if (!examTypeId) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const t = await getUserTarget(examTypeId).catch(() => null);
        setTarget(t);

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
            setEnhanced(r.data);
          } catch {
            setEnhanced(null);
          }
        }
      } catch (err) {
        setError(err?.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [examTypeId]);

  const enhancedMatches =
    enhanced && (!enhanced.examTypeId || enhanced.examTypeId === examTypeId);
  const isAchieved = Boolean(target?.achievedAt)
    || (enhancedMatches && enhanced?.isTargetMet === true);
  const nextSuggestion = useMemo(() => {
    if (!target?.targetScore) return null;
    return suggestNextTarget(target.targetScore);
  }, [target]);

  return (
    <div className={cx('wrapper')}>
      <div className={cx('headerBar')}>
        <Link to="/my-target/dashboard" className={cx('btn', 'btnGhost', 'btnSm')}>
          ← Tổng quan mục tiêu
        </Link>
      </div>

      <div className={cx('filterRow')}>
        <div className={cx('fieldGroup')}>
          <label className={cx('fieldLabel')}>Loại kỳ thi</label>
          <select
            className={cx('select')}
            value={examTypeId}
            onChange={(e) => setExamTypeId(e.target.value)}
          >
            {examTypes.map((et) => (
              <option key={et.examTypeId} value={et.examTypeId}>{et.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className={cx('alert', 'alertDanger')}>{error}</div>}
      {loading && <div className={cx('loading')}>Đang tải...</div>}

      {!loading && !target?.hasTarget && (
        <div className={cx('alert', 'alertInfo')}>
          <span>Bạn chưa đặt mục tiêu cho kỳ thi này.</span>
          <Link to={`/my-target?examTypeId=${examTypeId}`} className={cx('btn', 'btnPrimary', 'btnSm')}>
            Đặt mục tiêu
          </Link>
        </div>
      )}

      {!loading && target?.hasTarget && !isAchieved && (
        <div className={cx('alert', 'alertWarning')}>
          <span>
            Mock gần nhất chưa đạt mục tiêu {target.targetScore} điểm.{' '}
            {enhanced?.totalScore != null && (
              <>Điểm gần nhất: <strong>{enhanced.totalScore}</strong>.</>
            )}
          </span>
          <Link
            to={`/my-target/dashboard?examTypeId=${examTypeId}`}
            className={cx('btn', 'btnOutline', 'btnSm')}
          >
            Xem tiến độ
          </Link>
        </div>
      )}

      {!loading && isAchieved && (
        <>
          <div className={cx('hero')}>
            <div className={cx('heroEmoji')}>🎉</div>
            <h1 className={cx('heroTitle')}>Bạn đã đạt mục tiêu!</h1>
            <p className={cx('heroSubtitle')}>
              Mục tiêu: <strong>{target.targetScore}</strong>
              {enhancedMatches && enhanced?.totalScore != null && (
                <>
                  {' · '}Điểm đạt được:{' '}
                  <strong className={cx('successText')}>{enhanced.totalScore}</strong>
                  {' '}(+{enhanced.totalScore - target.targetScore})
                </>
              )}
            </p>
            <p className={cx('heroMeta')}>
              {target.achievedAt
                ? <>Đạt mục tiêu lúc: {formatDate(target.achievedAt)}</>
                : <>Mock đạt mục tiêu: {formatDate(latestMock?.finishedAt)}</>}
            </p>
          </div>

          <div className={cx('card')}>
            <div className={cx('cardHeader')}>Mục tiêu tiếp theo</div>
            <div className={cx('cardBody')}>
              <p className={cx('muted')} style={{ marginBottom: '1.6rem' }}>
                Bạn vừa hoàn thành chặng <strong>{target.targetScore}</strong>. Hãy đặt mục tiêu cao hơn để duy trì phong độ và mở khoá ngưỡng mới.
              </p>

              {nextSuggestion && (
                <div className={cx('suggestGrid')}>
                  <div className={cx('suggestCard')}>
                    <div className={cx('suggestLabel')}>Gợi ý</div>
                    <div className={cx('suggestValue')}>{nextSuggestion}</div>
                    <Link
                      to={`/my-target?examTypeId=${examTypeId}&suggest=${nextSuggestion}`}
                      className={cx('btn', 'btnSuccess', 'btnSm')}
                    >
                      Đặt {nextSuggestion}
                    </Link>
                  </div>
                  <div className={cx('suggestCard')}>
                    <div className={cx('suggestLabel')}>Vượt xa hơn</div>
                    <div className={cx('suggestValue')}>{Math.min(990, nextSuggestion + 50)}</div>
                    <Link
                      to={`/my-target?examTypeId=${examTypeId}&suggest=${Math.min(990, nextSuggestion + 50)}`}
                      className={cx('btn', 'btnOutline', 'btnSm')}
                    >
                      Thách thức
                    </Link>
                  </div>
                  <div className={cx('suggestCard')}>
                    <div className={cx('suggestLabel')}>Tự nhập</div>
                    <div className={cx('suggestValue')} style={{ fontSize: 'var(--font-size-lg)' }}>—</div>
                    <Link
                      to={`/my-target?examTypeId=${examTypeId}`}
                      className={cx('btn', 'btnOutline', 'btnSm')}
                    >
                      Vào trang target
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={cx('card')}>
            <div className={cx('cardHeader')}>Tiếp theo có thể làm</div>
            <div className={cx('cardBody')}>
              <ul style={{ paddingLeft: '2rem', margin: 0, fontSize: 'var(--font-size-ssm)' }}>
                <li>
                  <Link to={`/my-target?examTypeId=${examTypeId}`}>Đặt mục tiêu mới</Link>
                  {' '}— chỉnh điểm + aim từng Part.
                </li>
                <li>
                  <Link to={`/learning-plans/compare?examTypeId=${examTypeId}`}>
                    Xem hành trình các plan
                  </Link>
                  {' '}— readiness #1 → #N qua từng mock.
                </li>
                <li>
                  <Link to="/my-target/mocks">Lịch sử bài thi</Link>
                  {' '}— biểu đồ readiness theo thời gian.
                </li>
                <li>
                  <Link to="/">Làm thêm bài</Link>
                  {' '}— duy trì phong độ, chờ thi thật.
                </li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TargetAchievedPage;
