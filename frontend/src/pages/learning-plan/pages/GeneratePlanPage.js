import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import axios from '~/api/axiosClient';
import { getExamTypes } from '~/api/examTypeApi';
import { generatePlan } from '~/api/learningPlanApi';
import { getUserTarget } from '~/api/userTargetApi';
import LearningPlanList from '../components/LearningPlanList';
import PlanPartTaskList from '../components/PlanPartTaskList';
import styles from '../styles/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

function GeneratePlanPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const planListRef = useRef(null);

  const [userTests, setUserTests] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [userTestId, setUserTestId] = useState(searchParams.get('userTestId') || '');
  // Tạm ẩn: ngày thi / target score override khi sinh plan
  // const [deadlineDays, setDeadlineDays] = useState('');
  // const [targetScore, setTargetScore] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const [examTypes, setExamTypes] = useState([]);
  const [sourceExamTypeId, setSourceExamTypeId] = useState(
    searchParams.get('examTypeId') || '',
  );
  const [filterExamTypeId, setFilterExamTypeId] = useState(
    searchParams.get('examTypeId') || '',
  );
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const [loadingTarget, setLoadingTarget] = useState(false);
  const [userTarget, setUserTarget] = useState(null);

  useEffect(() => {
    let mounted = true;
    getExamTypes()
      .then((types) => {
        if (!mounted) return;
        const list = Array.isArray(types) ? types : [];
        setExamTypes(list);
        if (!sourceExamTypeId && list.length > 0) {
          const fromUrl = searchParams.get('examTypeId');
          const initial = fromUrl || list[0].examTypeId;
          setSourceExamTypeId(initial);
          setFilterExamTypeId(initial);
        }
      })
      .catch(() => { /* exam types optional for list */ });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoadingList(true);
    axios.get('/api/user-tests/my')
      .then((res) => {
        if (!mounted) return;
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        const completed = data.filter((t) => t.status === 'COMPLETED');
        setUserTests(completed);
      })
      .catch((err) => {
        if (mounted) setError(err?.response?.data?.message || err.message);
      })
      .finally(() => { if (mounted) setLoadingList(false); });
    return () => { mounted = false; };
  }, []);

  const filteredUserTests = useMemo(() => {
    if (!sourceExamTypeId) return userTests;
    return userTests.filter((t) => t.examTypeId === sourceExamTypeId);
  }, [userTests, sourceExamTypeId]);

  useEffect(() => {
    if (!sourceExamTypeId) {
      setUserTarget(null);
      return undefined;
    }
    let mounted = true;
    setLoadingTarget(true);
    getUserTarget(sourceExamTypeId)
      .then((data) => {
        if (mounted) setUserTarget(data);
      })
      .catch(() => {
        if (mounted) setUserTarget({ hasTarget: false });
      })
      .finally(() => {
        if (mounted) setLoadingTarget(false);
      });
    return () => { mounted = false; };
  }, [sourceExamTypeId]);

  const hasTarget = Boolean(userTarget?.hasTarget);
  /** Khóa chọn bài nguồn + nút sinh plan khi chưa có target (không khóa loại kỳ thi). */
  const testFormLocked = !sourceExamTypeId || loadingTarget || !hasTarget;

  useEffect(() => {
    if (!userTestId || loadingList) return;
    const stillVisible = filteredUserTests.some((t) => t.userTestId === userTestId);
    if (!stillVisible) {
      setUserTestId('');
    }
  }, [sourceExamTypeId, filteredUserTests, userTestId, loadingList]);

  const selectedTest = useMemo(
    () => userTests.find((t) => t.userTestId === userTestId),
    [userTests, userTestId],
  );

  useEffect(() => {
    if (selectedTest?.examTypeId) {
      setFilterExamTypeId(selectedTest.examTypeId);
      setSourceExamTypeId(selectedTest.examTypeId);
    }
  }, [userTestId, selectedTest?.examTypeId]);

  const handleSourceExamTypeChange = (nextId) => {
    setSourceExamTypeId(nextId);
    setFilterExamTypeId(nextId);
    setUserTestId('');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (nextId) next.set('examTypeId', nextId);
      else next.delete('examTypeId');
      return next;
    });
  };

  const sourceExamTypeName = useMemo(
    () => examTypes.find((et) => et.examTypeId === sourceExamTypeId)?.name || '',
    [examTypes, sourceExamTypeId],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setSubmitting(true);
    try {
      const payload = { userTestId };
      // if (deadlineDays !== '') payload.deadlineDays = Number(deadlineDays);
      // if (targetScore !== '') payload.targetScore = Number(targetScore);
      const data = await generatePlan(payload);
      setResult(data);
      if (data?.examTypeId) {
        setFilterExamTypeId(data.examTypeId);
      }
      setListRefreshKey((k) => k + 1);
      planListRef.current?.reload();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Lỗi không xác định');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (s) => (s ? new Date(s).toLocaleString('vi-VN', { hour12: false }) : '-');

  return (
    <div className={cx('wrapper')}>
      <div className={cx('headerBar')}>
        <h2 className={cx('title')}>Sinh lộ trình vượt ải</h2>
      </div>

      <p className={cx('subtitle')}>
        Một plan gồm nhiều Part (không trộn đề). Mỗi Part: mọi tag yếu (luyện ~50 câu/tag) → hai ải tổng ôn Part (mỗi ải ~200% số câu chuẩn của Part) → pass hết thì làm mock kiểm tra.
      </p>

      {sourceExamTypeId && !loadingTarget && !hasTarget && (
        <div className={cx('alert', 'alertWarning')}>
          <span>
            Bạn chưa đặt mục tiêu cho &quot;{sourceExamTypeName || 'kỳ thi này'}&quot;.
            Cần mục tiêu (điểm + % từng Part) trước khi sinh lộ trình.
          </span>
          <Link
            to={`/my-target?examTypeId=${encodeURIComponent(sourceExamTypeId)}`}
            className={cx('btn', 'btnPrimary', 'btnSm')}
          >
            Đặt mục tiêu
          </Link>
        </div>
      )}

      <div className={cx('card')}>
        <div className={cx('cardBody')}>
          <form onSubmit={handleSubmit}>
            <div className={cx('filterRow')} style={{ marginBottom: '1.6rem' }}>
              <div className={cx('fieldGroup')}>
                <label className={cx('fieldLabel')}>Loại kỳ thi (lọc bài nguồn)</label>
                <select
                  className={cx('select')}
                  value={sourceExamTypeId}
                  onChange={(e) => handleSourceExamTypeChange(e.target.value)}
                  disabled={examTypes.length === 0}
                >
                  {examTypes.length === 0 ? (
                    <option value="">Đang tải loại kỳ thi...</option>
                  ) : (
                    examTypes.map((et) => (
                      <option key={et.examTypeId} value={et.examTypeId}>
                        {et.name}
                      </option>
                    ))
                  )}
                </select>
                <small className={cx('muted')}>
                  Chỉ hiện mock/quick đã hoàn thành thuộc loại kỳ thi này.
                </small>
              </div>
            </div>

            <div className={cx('fieldGroup')} style={{ width: '100%', marginBottom: '1.6rem' }}>
              <label className={cx('fieldLabel')}>
                Bài thi nguồn (đã COMPLETED)
                {sourceExamTypeName ? ` · ${sourceExamTypeName}` : ''}
              </label>
              {loadingList ? (
                <div className={cx('muted')}>Đang tải danh sách bài thi...</div>
              ) : userTests.length === 0 ? (
                <div className={cx('alert', 'alertWarning')}>
                  Bạn chưa có bài thi nào đã hoàn thành. Hãy làm Quick Challenge hoặc Full Mock trước.
                </div>
              ) : filteredUserTests.length === 0 ? (
                <div className={cx('alert', 'alertWarning')}>
                  Chưa có bài hoàn thành cho loại kỳ thi này. Hãy làm mock thuộc &quot;{sourceExamTypeName || 'kỳ thi đã chọn'}&quot; hoặc đổi loại kỳ thi.
                </div>
              ) : (
                <select
                  className={cx('select')}
                  value={userTestId}
                  onChange={(e) => setUserTestId(e.target.value)}
                  required
                  disabled={testFormLocked}
                >
                  <option value="">-- Chọn bài thi --</option>
                  {filteredUserTests.map((t) => (
                    <option key={t.userTestId} value={t.userTestId}>
                      {formatDate(t.finishedAt)} · Score {t.totalScore ?? '—'} · testId={t.testId?.slice(0, 8) ?? '—'}…
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button
              type="submit"
              className={cx('btn', 'btnPrimary', 'btnLg')}
              disabled={submitting || testFormLocked || !userTestId || filteredUserTests.length === 0}
              style={{ marginTop: '1.6rem' }}
            >
              {submitting ? 'Đang sinh lộ trình...' : 'Sinh lộ trình'}
            </button>
          </form>
        </div>
      </div>

      {error && <div className={cx('alert', 'alertDanger')}>{error}</div>}

      {result?.targetAchieved && (
        <div className={cx('alert', 'alertSuccess')}>
          <span>
            {result.summary}
            <br />
            <small>Bạn có thể đặt mục tiêu cao hơn trong phần Target, hoặc tiếp tục làm mock để duy trì phong độ.</small>
          </span>
        </div>
      )}

      {result && !result.targetAchieved && (
        <div className={cx('card', 'cardPrimary')}>
          <div className={cx('cardHeader')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <strong>Plan #{result.planSequence ?? '—'}:</strong>{' '}
              <code className={cx('code')}>{result.learningPlanId.slice(0, 8)}…</code>
            </div>
            <button
              type="button"
              className={cx('btn', 'btnPrimary', 'btnSm')}
              onClick={() => navigate(`/learning-plans/${result.learningPlanId}#chon-ai-hoc`)}
            >
              Chọn ải để học
            </button>
          </div>
          <div className={cx('cardBody')}>
            <p>{result.summary}</p>
            <ul className={cx('metaList')}>
              <li><strong>Stage:</strong> {result.planStage}</li>
              <li>
                <strong>Readiness (chẩn đoán):</strong>{' '}
                {result.baselineReadiness ?? result.currentReadiness}% ({result.readinessLevel})
              </li>
              <li><strong>Target:</strong> {result.targetScore ?? 'N/A'}</li>
              <li><strong>Ải:</strong> {result.totalTasks} (ước tính ~{result.estimatedDaysRemaining} ngày)</li>
            </ul>

            {result.partsWithoutTasks?.length > 0 && (
              <div className={cx('alert', 'alertWarning')}>
                Part chưa đạt mục tiêu nhưng <strong>chưa có ải</strong> vì câu trong đề chưa gắn tag:{' '}
                {result.partsWithoutTasks.join(', ')}. Gắn tag câu hỏi (admin) rồi sinh plan lại.
              </div>
            )}

            <h5 className={cx('sectionTitle')} style={{ marginTop: '1.6rem' }}>
              Chọn Part và ải ({result.partGroups?.length || 0})
            </h5>
            <PlanPartTaskList
              partGroups={result.partGroups || []}
              learningPlanId={result.learningPlanId}
              studyAction="link"
            />
          </div>
        </div>
      )}

      <LearningPlanList
        ref={planListRef}
        loadAll
        allowAllInFilter
        examTypeId={filterExamTypeId}
        onExamTypeIdChange={setFilterExamTypeId}
        initialExamTypeId={searchParams.get('examTypeId') || ''}
        refreshKey={listRefreshKey}
        showExamTypeBadge
        title="Lộ trình đã sinh"
        emptyMessage="Chưa có lộ trình nào. Sinh plan từ form phía trên sau khi hoàn thành mock."
      />
    </div>
  );
}

export default GeneratePlanPage;
