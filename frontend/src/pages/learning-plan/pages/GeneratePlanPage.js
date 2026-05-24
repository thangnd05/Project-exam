import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import axios from '~/api/axiosClient';
import { generatePlan } from '~/api/learningPlanApi';
import LearningPlanList from '../components/LearningPlanList';
import PlanPartTaskList from '../components/PlanPartTaskList';
import styles from '../styles/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

function GeneratePlanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planListRef = useRef(null);

  const [userTests, setUserTests] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [userTestId, setUserTestId] = useState(searchParams.get('userTestId') || '');
  const [deadlineDays, setDeadlineDays] = useState('');
  const [targetScore, setTargetScore] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const [filterExamTypeId, setFilterExamTypeId] = useState(
    searchParams.get('examTypeId') || '',
  );
  const [listRefreshKey, setListRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;
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

  const selectedTest = useMemo(
    () => userTests.find((t) => t.userTestId === userTestId),
    [userTests, userTestId],
  );

  useEffect(() => {
    if (selectedTest?.examTypeId) {
      setFilterExamTypeId(selectedTest.examTypeId);
    }
  }, [userTestId, selectedTest?.examTypeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setSubmitting(true);
    try {
      const payload = { userTestId };
      if (deadlineDays !== '') payload.deadlineDays = Number(deadlineDays);
      if (targetScore !== '') payload.targetScore = Number(targetScore);
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
        Một plan gồm nhiều Part (mỗi Part tách riêng, không trộn đề). Trong mỗi Part: các tag yếu → đọc tài liệu → 10 câu → pass mới sang ải/Part tiếp.
      </p>

      <div className={cx('card')}>
        <div className={cx('cardBody')}>
          <form onSubmit={handleSubmit}>
            <div className={cx('fieldGroup')} style={{ width: '100%', marginBottom: '1.6rem' }}>
              <label className={cx('fieldLabel')}>Bài thi nguồn (đã COMPLETED)</label>
              {loadingList ? (
                <div className={cx('muted')}>Đang tải danh sách bài thi...</div>
              ) : userTests.length === 0 ? (
                <div className={cx('alert', 'alertWarning')}>
                  Bạn chưa có bài thi nào đã hoàn thành. Hãy làm Quick Challenge hoặc Full Mock trước.
                </div>
              ) : (
                <select
                  className={cx('select')}
                  value={userTestId}
                  onChange={(e) => setUserTestId(e.target.value)}
                  required
                >
                  <option value="">-- Chọn bài thi --</option>
                  {userTests.map((t) => (
                    <option key={t.userTestId} value={t.userTestId}>
                      {formatDate(t.finishedAt)} · Score {t.totalScore ?? '—'} · testId={t.testId.slice(0, 8)}…
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className={cx('filterRow')}>
              <div className={cx('fieldGroup')}>
                <label className={cx('fieldLabel')}>Ngày đến ngày thi (optional)</label>
                <input
                  type="number"
                  className={cx('select')}
                  value={deadlineDays}
                  onChange={(e) => setDeadlineDays(e.target.value)}
                  placeholder="VD: 28"
                  min={3}
                  max={365}
                />
                <small className={cx('muted')}>Chỉ ước lượng, không ép sang ải mới.</small>
              </div>
              <div className={cx('fieldGroup')}>
                <label className={cx('fieldLabel')}>Target score (optional)</label>
                <input
                  type="number"
                  className={cx('select')}
                  value={targetScore}
                  onChange={(e) => setTargetScore(e.target.value)}
                  placeholder="VD: 750"
                />
                <small className={cx('muted')}>Bỏ trống → dùng UserTarget đã set.</small>
              </div>
            </div>

            <button
              type="submit"
              className={cx('btn', 'btnPrimary', 'btnLg')}
              disabled={submitting || !userTestId || userTests.length === 0}
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
