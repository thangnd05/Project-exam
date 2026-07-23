import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import { formatDateTime24 as formatDate } from '~/shared/utils/format-date-time';
import LearningPlanList from '../components/LearningPlanList';
import PlanPartTaskList from '../components/PlanPartTaskList';
import TargetPlanTabs from '~/features/diagnostic/TargetPlanTabs';
import InfoTip from '~/shared/ui/InfoTip/InfoTip';
import { TERM_TIPS } from '~/features/diagnostic/termTips';
import { planStageLabel } from '../planLabels';
import { getReadinessLabel } from '~/features/diagnostic/target/utils/readiness-label';
import styles from '~/features/diagnostic/styles/PersonalizedPlan.module.scss';
import {
  useCompletedUserTests,
  useExamTypes,
  useGeneratePlanMutation,
  useUserTarget,
} from './hooks/useGeneratePlan';

const cx = classNames.bind(styles);

function GeneratePlanPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const planListRef = useRef(null);

  const [userTestId, setUserTestId] = useState(searchParams.get('userTestId') || '');

  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const [sourceExamTypeId, setSourceExamTypeId] = useState(
    searchParams.get('examTypeId') || '',
  );
  const [filterExamTypeId, setFilterExamTypeId] = useState(
    searchParams.get('examTypeId') || '',
  );
  const [listRefreshKey, setListRefreshKey] = useState(0);

  const examTypesQuery = useExamTypes();
  const examTypes = examTypesQuery.data ?? [];

  const userTestsQuery = useCompletedUserTests();
  const userTests = userTestsQuery.data ?? [];
  const loadingList = userTestsQuery.isLoading;
  const userTestsError = userTestsQuery.isError
    ? userTestsQuery.error?.response?.data?.message || userTestsQuery.error?.message
    : null;

  const targetQuery = useUserTarget(sourceExamTypeId);
  const userTarget = targetQuery.data ?? null;
  const loadingTarget = targetQuery.isLoading;

  const generatePlanMutation = useGeneratePlanMutation();
  const submitting = generatePlanMutation.isPending;

  useEffect(() => {
    if (!sourceExamTypeId && examTypes.length > 0) {
      const fromUrl = searchParams.get('examTypeId');
      const initial = fromUrl || examTypes[0].examTypeId;
      setSourceExamTypeId(initial);
      setFilterExamTypeId(initial);
    }
  }, [examTypes, sourceExamTypeId]);

  const filteredUserTests = useMemo(() => {
    if (!sourceExamTypeId) return userTests;
    return userTests.filter((t) => t.examTypeId === sourceExamTypeId);
  }, [userTests, sourceExamTypeId]);

  const hasTarget = Boolean(userTarget?.hasTarget);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    const payload = { userTestId };

    generatePlanMutation.mutate(payload, {
      onSuccess: (data) => {
        setResult(data);
        if (data?.examTypeId) {
          setFilterExamTypeId(data.examTypeId);
        }
        setListRefreshKey((k) => k + 1);
        planListRef.current?.reload();
      },
      onError: (err) => {
        setError(err?.response?.data?.message || err.message || 'Lỗi không xác định');
      },
    });
  };

  return (
    <div className={cx('wrapper')}>
      <TargetPlanTabs active="plan" examTypeId={sourceExamTypeId} />
      <div className={cx('headerBar')}>
        <h2 className={cx('title')}>Sinh lộ trình vượt ải</h2>
      </div>

      <p className={cx('subtitle')}>
        Kế hoạch học tập tạo dựa trên bài thi của bạn. Mỗi Part: mọi tag yếu (luyện ~50 câu/tag) → hai ải tổng ôn Part (mỗi ải ~200% số câu chuẩn của Part) → pass hết thì làm mock kiểm tra.
      </p>

      {sourceExamTypeId && !loadingTarget && !hasTarget && (
        <div className={cx('alert', 'alertWarning')}>
          <span>
            Bạn chưa đặt mục tiêu cho &quot;{sourceExamTypeName || 'kỳ thi này'}&quot;.
            Sang tab <strong>Mục tiêu</strong> đặt trước (có mốc gợi ý sẵn), rồi quay lại đây sinh lộ trình.
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
                      {t.testTitle ? `${t.testTitle} — ` : ''}
                      {formatDate(t.finishedAt)} · Score {t.totalScore ?? '—'}
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

      {(error || userTestsError) && (
        <div className={cx('alert', 'alertDanger')}>{error || userTestsError}</div>
      )}

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
              <li><strong>Giai đoạn:</strong> {planStageLabel(result.planStage)}</li>
              <li>
                <strong>Độ sẵn sàng (chẩn đoán):</strong>
                <InfoTip text={TERM_TIPS.readiness} />{' '}
                {result.baselineReadiness ?? result.currentReadiness}% ({getReadinessLabel(result.readinessLevel)})
              </li>
              <li><strong>Mục tiêu:</strong> {result.targetScore ?? 'N/A'}</li>
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
              recommendedTaskId={result.recommendedTaskId}
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
