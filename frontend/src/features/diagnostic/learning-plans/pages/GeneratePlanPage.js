import { useEffect, useMemo, useState } from 'react';
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

const isPracticeAttempt = (userTest) => (userTest?.practicePartIds?.length ?? 0) > 0;

function GeneratePlanPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

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
  const targetError = targetQuery.isError
    ? targetQuery.error?.response?.data?.message
      || targetQuery.error?.message
      || 'Không tải được mục tiêu'
    : null;

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

  const testFormLocked = !sourceExamTypeId || loadingTarget || !!targetError || !hasTarget;

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

      <div className={cx('stepsGuide')}>
        <div className={cx('stepItem')}>
          <span className={cx('stepNum')}>1</span>
          <div>
            <div className={cx('stepTitle')}>Chọn bài thi đã làm</div>
            <div className={cx('stepDesc')}>
              Hệ thống chẩn đoán điểm yếu của bạn từ bài này.
            </div>
          </div>
        </div>
        <div className={cx('stepItem')}>
          <span className={cx('stepNum')}>2</span>
          <div>
            <div className={cx('stepTitle')}>Sinh lộ trình</div>
            <div className={cx('stepDesc')}>
              Lộ trình chia theo từng phần thi, mỗi phần là chuỗi ải cần vượt.
            </div>
          </div>
        </div>
        <div className={cx('stepItem')}>
          <span className={cx('stepNum')}>3</span>
          <div>
            <div className={cx('stepTitle')}>Vượt ải rồi thi thử</div>
            <div className={cx('stepDesc')}>
              Vượt hết ải thì làm bài thi thử để kiểm tra lại và cập nhật lộ trình.
            </div>
          </div>
        </div>
      </div>

      {sourceExamTypeId && targetError && (
        <div className={cx('alert', 'alertDanger')}>
          <span>Không tải được mục tiêu cho &quot;{sourceExamTypeName || 'kỳ thi này'}&quot;: {targetError}.</span>
          <button
            type="button"
            className={cx('btn', 'btnPrimary', 'btnSm')}
            onClick={() => targetQuery.refetch()}
          >
            Thử lại
          </button>
        </div>
      )}

      {sourceExamTypeId && !loadingTarget && !targetError && !hasTarget && (
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
            <div className={cx('filterRow')} style={{ marginBottom: '1.6rem', alignItems: 'flex-start' }}>
              <div className={cx('fieldGroup')} style={{ flex: 1 }}>
                <label className={cx('fieldLabel')}>Loại kỳ thi</label>
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
                  Chỉ hiện bài đã hoàn thành thuộc loại kỳ thi này.
                </small>
              </div>

              <div className={cx('fieldGroup')} style={{ flex: 1 }}>
                <label className={cx('fieldLabel')}>
                  Chọn bài thi muốn lập kế hoạch
                </label>
              {loadingList ? (
                <div className={cx('muted')}>Đang tải danh sách bài thi...</div>
              ) : userTests.length === 0 ? (
                <div className={cx('alert', 'alertWarning')}>
                  Bạn chưa có bài thi nào đã hoàn thành. Hãy làm một bài thử thách nhanh hoặc thi thử trước.
                </div>
              ) : filteredUserTests.length === 0 ? (
                <div className={cx('alert', 'alertWarning')}>
                  Chưa có bài hoàn thành cho loại kỳ thi này. Hãy làm bài thi thử thuộc &quot;{sourceExamTypeName || 'kỳ thi đã chọn'}&quot; hoặc đổi loại kỳ thi.
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
                      {formatDate(t.finishedAt)} · Điểm {t.totalScore ?? '—'}
                      {isPracticeAttempt(t) ? ' · Luyện theo Part' : ''}
                    </option>
                  ))}
                </select>
              )}
              {isPracticeAttempt(selectedTest) && (
                <small className={cx('warningText')}>
                  Bài này chỉ luyện một phần đề nên lộ trình sinh ra chỉ phủ các Part đã luyện.
                  Muốn lộ trình đầy đủ, hãy chọn một bài thi thử trọn đề.
                </small>
              )}
              </div>
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
            <small>Bạn có thể đặt mục tiêu cao hơn trong tab Mục tiêu, hoặc tiếp tục làm bài thi thử để duy trì phong độ.</small>
          </span>
        </div>
      )}

      {result && !result.targetAchieved && (
        <div className={cx('card', 'cardPrimary')}>
          <div className={cx('cardHeader')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <strong>Lộ trình #{result.planSequence ?? '—'}:</strong>{' '}
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
                {result.baselineReadiness ?? '—'}% ({getReadinessLabel(result.readinessLevel)})
              </li>
              <li><strong>Mục tiêu:</strong> {result.targetScore ?? 'N/A'}</li>
              <li><strong>Ải:</strong> {result.totalTasks} (ước tính ~{result.estimatedDaysRemaining} ngày)</li>
            </ul>

            {result.diagnosisSourceCategory === 'QUICK_CHALLENGE' && (
              <div className={cx('alert')}>
                Lộ trình này chẩn đoán từ một <strong>bài thử thách nhanh</strong>. Ôn xong các ải,
                hãy làm một <strong>bài thi thử đầy đủ</strong> để chẩn đoán chính xác hơn.
              </div>
            )}

            {result.diagnosisSourcePractice && (
              <div className={cx('alert', 'alertWarning')}>
                Lộ trình này chẩn đoán từ một <strong>bài luyện theo Part</strong> nên chỉ phủ các
                Part đã luyện. Làm một <strong>bài thi thử trọn đề</strong> rồi sinh lại để có lộ
                trình cho toàn bộ kỳ thi.
              </div>
            )}

            {result.partsWithoutTasks?.length > 0 && (
              <div className={cx('alert', 'alertWarning')}>
                Part chưa đạt mục tiêu nhưng <strong>chưa có ải</strong> vì câu trong đề chưa gắn tag:{' '}
                {result.partsWithoutTasks.join(', ')}. Gắn tag câu hỏi (admin) rồi sinh lộ trình lại.
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
        loadAll
        allowAllInFilter
        examTypeId={filterExamTypeId}
        onExamTypeIdChange={setFilterExamTypeId}
        initialExamTypeId={searchParams.get('examTypeId') || ''}
        refreshKey={listRefreshKey}
        showExamTypeBadge
        title="Lộ trình đã sinh"
        emptyMessage={null}
        showRefreshButton={false}
      />
    </div>
  );
}

export default GeneratePlanPage;
