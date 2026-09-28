'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearchParamsState } from '@/app/hooks/useSearchParamsState';
import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames/bind';
import { formatDateTime24 as formatDate } from '@/app/utils/format-date-time';
import LearningPlanList from './_components/LearningPlanList';
import TargetPlanTabs from '@/app/components/TargetPlanTabs/TargetPlanTabs';
import { isPracticeAttempt } from '@/app/utils/planLabels';
import { getLearnerLevel } from '@/app/utils/learnerLevel';
import routes, { buildExamTypeDetailPath } from '@/app/configs/Routes';
import styles from '@/app/assets/styles/diagnostic/PersonalizedPlan.module.scss';
import type { PlanResponse } from '@/app/types';
import {
  useCompletedUserTests,
  useExamTypes,
  useGeneratePlanMutation,
  useGenerateSyllabusPlanMutation,
  useUserTarget,
} from '@/app/hooks/useGeneratePlan';

type PlanSource = 'DIAGNOSIS' | 'SYLLABUS';

const cx = classNames.bind(styles);

function GeneratePlan() {
  const router = useRouter();
  const [searchParams, setSearchParams] = useSearchParamsState();

  const forcedSyllabus = searchParams.get('source') === 'syllabus';
  const userTestIdFromUrl = searchParams.get('userTestId') || '';

  const [userTestId, setUserTestId] = useState(userTestIdFromUrl);
  const [planSource, setPlanSource] = useState<PlanSource>(
    forcedSyllabus ? 'SYLLABUS' : 'DIAGNOSIS',
  );
  // Đi từ trang kết quả sang thì đã chọn sẵn bài, không tự đổi sang chương trình học.
  const [planSourceTouched, setPlanSourceTouched] = useState(
    forcedSyllabus || Boolean(userTestIdFromUrl),
  );

  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlanResponse | null>(null);

  const [sourceExamTypeId, setSourceExamTypeId] = useState(
    searchParams.get('examTypeId') || '',
  );
  const [filterExamTypeId, setFilterExamTypeId] = useState(
    searchParams.get('examTypeId') || '',
  );
  const [listRefreshKey, setListRefreshKey] = useState(0);

  const { examTypes } = useExamTypes();

  const {
    userTests,
    isLoading: loadingList,
    error: userTestsError,
  } = useCompletedUserTests();

  const {
    userTarget,
    isLoading: loadingTarget,
    error: targetError,
    refetch: refetchTarget,
  } = useUserTarget(sourceExamTypeId);

  const generatePlanMutation = useGeneratePlanMutation();
  const generateSyllabusMutation = useGenerateSyllabusPlanMutation();
  const submitting = generatePlanMutation.isPending || generateSyllabusMutation.isPending;

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

  const examTypeReady = Boolean(sourceExamTypeId) && !loadingTarget && !targetError;
  // Lộ trình theo chương trình học chạy được khi chưa đặt mục tiêu; chẩn đoán từ bài thi thì không.
  const formLocked = !examTypeReady || (planSource === 'DIAGNOSIS' && !hasTarget);

  // Người tự khai là mới, hoặc chưa có bài nào của kỳ thi này, thì mặc định đi theo chương trình học.
  useEffect(() => {
    if (planSourceTouched || !sourceExamTypeId || loadingList) return;
    const beginner =
      getLearnerLevel(sourceExamTypeId) === 'BEGINNER' || filteredUserTests.length === 0;
    setPlanSource(beginner ? 'SYLLABUS' : 'DIAGNOSIS');
  }, [planSourceTouched, sourceExamTypeId, loadingList, filteredUserTests.length]);

  // Đổi kỳ thi thủ công đã tự bỏ chọn bài; ở đây chỉ bỏ khi bài không còn tồn tại, để bài
  // truyền từ trang kết quả không bị xoá trước khi kỳ thi kịp đồng bộ theo bài đó.
  useEffect(() => {
    if (!userTestId || loadingList) return;
    if (!userTests.some((t) => t.userTestId === userTestId)) {
      setUserTestId('');
    }
  }, [userTests, userTestId, loadingList]);

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

  const handleSourceExamTypeChange = (nextId: string) => {
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const handlers = {
      onSuccess: (data: PlanResponse) => {
        // Sinh xong thì đưa thẳng vào lộ trình mới, người mới không phải tự tìm trong danh sách.
        if (!data?.targetAchieved && data?.learningPlanId) {
          router.push(`/learning-plans/${data.learningPlanId}`);
          return;
        }
        setResult(data);
        if (data?.examTypeId) {
          setFilterExamTypeId(data.examTypeId);
        }

        setListRefreshKey((k) => k + 1);
      },
      onError: (err: any) => {
        setError(err?.response?.data?.message || err.message || 'Lỗi không xác định');
      },
    };

    if (planSource === 'SYLLABUS') {
      generateSyllabusMutation.mutate({ examTypeId: sourceExamTypeId }, handlers);
      return;
    }
    generatePlanMutation.mutate({ userTestId }, handlers);
  };

  const handlePlanSourceChange = (next: PlanSource) => {
    setPlanSourceTouched(true);
    setPlanSource(next);
    setError(null);
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
            <div className={cx('stepTitle')}>
              {planSource === 'SYLLABUS' ? 'Chọn kỳ thi muốn học' : 'Chọn bài thi đã làm'}
            </div>
            <div className={cx('stepDesc')}>
              {planSource === 'SYLLABUS'
                ? 'Chưa làm bài nào cũng được  lộ trình đi theo chương trình của kỳ thi.'
                : 'Hệ thống chẩn đoán điểm yếu của bạn từ bài này.'}
            </div>
          </div>
        </div>
        <div className={cx('stepItem')}>
          <span className={cx('stepNum')}>2</span>
          <div>
            <div className={cx('stepTitle')}>Sinh lộ trình</div>
            <div className={cx('stepDesc')}>
              Lộ trình chia thành các chặng (mỗi chặng là một phần thi). Mỗi chặng gồm nhiều ải
              lượt luyện ngắn về một chủ đề, làm đủ % câu đúng là vượt.
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
            onClick={() => refetchTarget()}
          >
            Thử lại
          </button>
        </div>
      )}

      {sourceExamTypeId && !loadingTarget && !targetError && !hasTarget && (
        <div className={cx('alert', planSource === 'SYLLABUS' ? 'alertInfo' : 'alertWarning')}>
          <span>
            {planSource === 'SYLLABUS' ? (
              <>
                Bạn chưa đặt mục tiêu cho &quot;{sourceExamTypeName || 'kỳ thi này'}&quot; nên
                ngưỡng vượt ải tạm dùng mức mặc định. Cứ sinh lộ trình và học trước; khi nào đặt
                mục tiêu, bấm <strong>Cập nhật theo mục tiêu mới</strong> là lộ trình áp ngưỡng
                đúng mà vẫn giữ tiến độ.
              </>
            ) : (
              <>
                Bạn chưa đặt mục tiêu cho &quot;{sourceExamTypeName || 'kỳ thi này'}&quot;.
                Sang tab <strong>Mục tiêu</strong> đặt trước (có mốc gợi ý sẵn), rồi quay lại đây sinh lộ trình.
              </>
            )}
          </span>
          <Link
            href={`/my-target?${new URLSearchParams({
              examTypeId: sourceExamTypeId,
              next: `${routes.generatePlan}?${new URLSearchParams({
                examTypeId: sourceExamTypeId,
                ...(userTestId ? { userTestId } : {}),
              }).toString()}`,
            }).toString()}`}
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
                {planSource === 'DIAGNOSIS' && (
                  <small className={cx('muted')}>
                    Chỉ hiện bài đã hoàn thành thuộc loại kỳ thi này.
                  </small>
                )}
              </div>

              <div className={cx('fieldGroup')} style={{ flex: 1 }}>
                <label className={cx('fieldLabel')}>Lộ trình dựa trên</label>
                <select
                  className={cx('select')}
                  value={planSource}
                  onChange={(e) => handlePlanSourceChange(e.target.value as PlanSource)}
                  disabled={!examTypeReady}
                >
                  <option value="SYLLABUS">
                    Chương trình học  tôi mới bắt đầu, chưa làm bài nào
                  </option>
                  <option value="DIAGNOSIS">
                    Kết quả một bài thi  chẩn đoán điểm yếu của tôi
                  </option>
                </select>
                <small className={cx('muted')}>
                  {planSource === 'SYLLABUS'
                    ? 'Đi tuần tự hết các chủ điểm của từng phần. Làm bài thi thử sau để sinh lộ trình sát hơn.'
                    : 'Ưu tiên các chủ điểm bạn làm sai nhiều nhất trong bài đã chọn.'}
                </small>
              </div>
            </div>

            {planSource === 'DIAGNOSIS' && (
              <div className={cx('fieldGroup')} style={{ marginBottom: '1.6rem' }}>
                <label className={cx('fieldLabel')}>
                  Chọn bài thi muốn lập lộ trình
                </label>
              {loadingList ? (
                <div className={cx('muted')}>Đang tải danh sách bài thi...</div>
              ) : userTests.length === 0 ? (
                <div className={cx('alert', 'alertWarning')}>
                  Bạn chưa có bài thi nào đã hoàn thành. Hãy làm một bài thử thách nhanh hoặc thi thử trước.{' '}
                  <Link href={sourceExamTypeId ? buildExamTypeDetailPath(sourceExamTypeId) : routes.examTypes}>
                    Chọn bài để làm
                  </Link>
                </div>
              ) : filteredUserTests.length === 0 ? (
                <div className={cx('alert', 'alertWarning')}>
                  Chưa có bài hoàn thành cho loại kỳ thi này. Hãy làm bài thi thử thuộc &quot;{sourceExamTypeName || 'kỳ thi đã chọn'}&quot; hoặc đổi loại kỳ thi.{' '}
                  <Link href={buildExamTypeDetailPath(sourceExamTypeId)}>Xem đề thi</Link>
                </div>
              ) : (
                <select
                  className={cx('select')}
                  value={userTestId}
                  onChange={(e) => setUserTestId(e.target.value)}
                  required
                  disabled={formLocked}
                >
                  <option value="">-- Chọn bài thi --</option>
                  {filteredUserTests.map((t) => (
                    <option key={t.userTestId} value={t.userTestId}>
                      {t.testTitle ? `${t.testTitle}  ` : ''}
                      {formatDate(t.finishedAt)} · Điểm {t.totalScore ?? '-'}
                      {isPracticeAttempt(t) ? ' · Luyện theo phần' : ''}
                    </option>
                  ))}
                </select>
              )}
              {isPracticeAttempt(selectedTest) && (
                <small className={cx('warningText')}>
                  Bài này chỉ luyện một phần đề nên lộ trình sinh ra chỉ phủ các phần đã luyện.
                  Muốn lộ trình đầy đủ, hãy chọn một bài thi thử trọn đề.
                </small>
              )}
              </div>
            )}

            <button
              type="submit"
              className={cx('btn', 'btnPrimary', 'btnLg')}
              disabled={
                submitting ||
                formLocked ||
                (planSource === 'DIAGNOSIS' && (!userTestId || filteredUserTests.length === 0))
              }
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
            Bạn đã đạt mục tiêu (mức sẵn sàng {result.baselineReadiness ?? 0}%), chưa cần sinh lộ trình mới.
            <br />
            <small>Bạn có thể đặt mục tiêu cao hơn trong tab Mục tiêu, hoặc tiếp tục làm bài thi thử để duy trì phong độ.</small>
          </span>
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

export default GeneratePlan;
