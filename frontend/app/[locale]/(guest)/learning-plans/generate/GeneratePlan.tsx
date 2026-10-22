'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearchParamsState } from '@/app/hooks/useSearchParamsState';
import { examTypeIdFromParams, setExamParam, useNormalizeExamParam } from '@/app/features/exam-types/hooks/useExamParam';
import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import classNamesBind from 'classnames/bind';
import { FiAlertTriangle, FiBookOpen, FiTarget } from 'react-icons/fi';
import { formatDateTime24 as formatDate } from '@/app/utils/format-date-time';
import LearningPlanList from './_components/LearningPlanList';
import TargetPlanTabs from '@/app/features/my-target/TargetPlanTabs/TargetPlanTabs';
import ExamPillPicker from '@/app/features/my-target/ExamPillPicker/ExamPillPicker';
import ExamHeading from '@/app/features/my-target/ExamHeading/ExamHeading';
import { isPracticeAttempt } from '@/app/features/learning-plans/planLabels';
import { getLearnerLevel } from '@/app/features/learning-plans/learnerLevel';
import routes, { buildExamTypeDetailPath } from '@/app/configs/Routes';
import { useAuth } from '@/app/hooks/useAuth';
import { getApiErrorMessage } from '@/app/utils/apiError';
import { buildLoginUrlFromHere } from '@/app/features/auth/authRedirect';
import ConfirmModal from '@/app/components/modal/ConfirmModal';
import planStyles from '@/app/assets/styles/diagnostic/PersonalizedPlan.module.scss';
import uiStyles from '@/app/assets/styles/FlatUi.module.scss';
import styles from './GeneratePlan.module.scss';
import type { PlanResponse } from '@/app/types';
import {
  useActivePlan,
  useCompletedUserTests,
  useExamTypes,
  useGeneratePlanMutation,
  useGenerateSyllabusPlanMutation,
  useUserTarget,
} from '@/app/features/learning-plans/hooks/useGeneratePlan';

type PlanSource = 'DIAGNOSIS' | 'SYLLABUS';

const cx = classNamesBind.bind(styles);
const ui = classNamesBind.bind(uiStyles);
const planCx = classNamesBind.bind(planStyles);

const PLAN_SOURCES: {
  value: PlanSource;
  title: string;
  subtitle: string;
  desc: string;
  icon: React.ElementType;
}[] = [
  {
    value: 'SYLLABUS',
    title: 'Chương trình học',
    subtitle: 'Tôi mới bắt đầu, chưa làm bài nào',
    desc: 'Đi tuần tự hết các chủ điểm của từng phần. Làm bài thi thử sau để sinh lộ trình sát hơn.',
    icon: FiBookOpen,
  },
  {
    value: 'DIAGNOSIS',
    title: 'Kết quả một bài thi',
    subtitle: 'Chẩn đoán điểm yếu của tôi',
    desc: 'Ưu tiên các chủ điểm bạn làm sai nhiều nhất trong bài đã chọn.',
    icon: FiTarget,
  },
];

function GeneratePlan() {
  const router = useRouter();
  const [searchParams, setSearchParams] = useSearchParamsState();
  const { isAuthenticated, loading: authLoading } = useAuth();
  // Khách vẫn xem được trang, chỉ khi bấm thao tác mới bị đưa sang đăng nhập.
  const isGuest = !authLoading && !isAuthenticated;
  const requireLogin = () => router.push(buildLoginUrlFromHere('Bạn cần đăng nhập để sinh lộ trình!'));

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

  // ?exam=<slug> chỉ dịch ra id khi danh sách kỳ thi tải xong, nên bắt đầu rỗng rồi chọn ở effect dưới.
  const [sourceExamTypeId, setSourceExamTypeId] = useState('');
  const [filterExamTypeId, setFilterExamTypeId] = useState('');
  const [listRefreshKey, setListRefreshKey] = useState(0);

  const { examTypes } = useExamTypes();
  const examTypeIdFromUrl = examTypeIdFromParams(searchParams, examTypes);
  useNormalizeExamParam(examTypes);

  const {
    userTests,
    isLoading: loadingList,
    isFetching: fetchingList,
    error: userTestsError,
  } = useCompletedUserTests(isAuthenticated);

  const {
    userTarget,
    isLoading: loadingTarget,
    error: targetError,
    refetch: refetchTarget,
  } = useUserTarget(sourceExamTypeId, isAuthenticated);

  const { activePlan } = useActivePlan(sourceExamTypeId, isAuthenticated);
  const [confirmReplaceOpen, setConfirmReplaceOpen] = useState(false);

  const generatePlanMutation = useGeneratePlanMutation();
  const generateSyllabusMutation = useGenerateSyllabusPlanMutation();
  // Giữ nút khoá cả lúc đang chuyển sang lộ trình mới, tránh bấm lần hai sinh thêm một lộ trình nữa.
  const [navigating, setNavigating] = useState(false);
  const submitting =
    generatePlanMutation.isPending || generateSyllabusMutation.isPending || navigating;

  // Danh sách kỳ thi vừa tải xong mà chưa chọn: chọn theo URL, không có thì lấy kỳ thi đầu tiên.
  if (!sourceExamTypeId && examTypes.length > 0) {
    const initial = examTypeIdFromUrl || examTypes[0].examTypeId;
    setSourceExamTypeId(initial);
    setFilterExamTypeId(initial);
  }

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- trình độ tự khai đọc từ localStorage, chỉ đọc sau mount để không lệch hydration
    setPlanSource(beginner ? 'SYLLABUS' : 'DIAGNOSIS');
  }, [planSourceTouched, sourceExamTypeId, loadingList, filteredUserTests.length]);

  // Đổi kỳ thi thủ công đã tự bỏ chọn bài; ở đây chỉ bỏ khi bài không còn tồn tại, để bài
  // truyền từ trang kết quả không bị xoá trước khi kỳ thi kịp đồng bộ theo bài đó.
  // Chờ cả lượt tải lại xong: bài vừa nộp có thể chưa có trong bản cache cũ.
  // Chờ cả đăng nhập xong: lúc đó query danh sách bài mới chạy, trước đó danh sách luôn rỗng.
  if (
    userTestId &&
    !authLoading &&
    !loadingList &&
    !fetchingList &&
    !userTests.some((t) => t.userTestId === userTestId)
  ) {
    setUserTestId('');
  }

  const selectedTest = useMemo(
    () => userTests.find((t) => t.userTestId === userTestId),
    [userTests, userTestId],
  );

  // Chọn bài khác (hoặc bài vừa tải xong) thì đồng bộ kỳ thi theo bài đó.
  const selectedSyncKey = `${userTestId}|${selectedTest?.examTypeId ?? ''}`;
  const [syncedSelectedKey, setSyncedSelectedKey] = useState<string | null>(null);
  if (selectedSyncKey !== syncedSelectedKey) {
    setSyncedSelectedKey(selectedSyncKey);
    if (selectedTest?.examTypeId) {
      setFilterExamTypeId(selectedTest.examTypeId);
      setSourceExamTypeId(selectedTest.examTypeId);
    }
  }

  const handleSourceExamTypeChange = (nextId: string) => {
    setSourceExamTypeId(nextId);
    setFilterExamTypeId(nextId);
    setUserTestId('');
    setSearchParams((prev) => setExamParam(prev, nextId, examTypes));
  };

  const sourceExamType = useMemo(
    () => examTypes.find((et) => et.examTypeId === sourceExamTypeId),
    [examTypes, sourceExamTypeId],
  );
  const sourceExamTypeName = sourceExamType?.name || '';

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAuthenticated) {
      requireLogin();
      return;
    }
    // Sinh mới sẽ thay lộ trình đang học, nên hỏi lại trước.
    if (activePlan) {
      setConfirmReplaceOpen(true);
      return;
    }
    runGenerate();
  };

  const runGenerate = () => {
    setConfirmReplaceOpen(false);
    setError(null);
    setResult(null);

    const handlers = {
      onSuccess: (data: PlanResponse) => {
        // Sinh xong thì đưa thẳng vào lộ trình mới, người mới không phải tự tìm trong danh sách.
        if (!data?.targetAchieved && data?.learningPlanId) {
          setNavigating(true);
          router.push(`/learning-plans/${data.learningPlanId}`);
          return;
        }
        setResult(data);
        if (data?.examTypeId) {
          setFilterExamTypeId(data.examTypeId);
        }

        setListRefreshKey((k) => k + 1);
      },
      onError: (err: unknown) => {
        setError(
          getApiErrorMessage(
            err,
            (err instanceof Error && err.message) || 'Lỗi không xác định',
          ),
        );
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

  const submitDisabled =
    authLoading ||
    submitting ||
    (!isGuest &&
      (formLocked ||
        (planSource === 'DIAGNOSIS' && (!userTestId || filteredUserTests.length === 0))));

  const renderTestPicker = () => {
    if (isGuest) {
      return (
        <div className={ui('notice', 'noticeInfo')}>
          <span>Đăng nhập để chọn bài thi bạn đã làm.</span>
          <button type="button" className={ui('btnPrimary', 'btnSm')} onClick={requireLogin}>
            Đăng nhập
          </button>
        </div>
      );
    }
    if (loadingList) {
      return <div className={ui('skeleton')} aria-hidden="true" />;
    }
    if (userTests.length === 0) {
      return (
        <div className={ui('notice', 'noticeWarning')}>
          <span>
            Bạn chưa có bài thi nào đã hoàn thành. Hãy làm một bài thử thách nhanh hoặc thi thử trước.
          </span>
          <Link
            href={sourceExamTypeId ? buildExamTypeDetailPath(sourceExamTypeId) : routes.examTypes}
            className={ui('btnSecondary', 'btnSm')}
          >
            Chọn bài để làm
          </Link>
        </div>
      );
    }
    if (filteredUserTests.length === 0) {
      return (
        <div className={ui('notice', 'noticeWarning')}>
          <span>
            Chưa có bài hoàn thành cho &quot;{sourceExamTypeName || 'kỳ thi đã chọn'}&quot;. Hãy làm
            bài thi thử của kỳ thi này hoặc đổi kỳ thi khác.
          </span>
          <Link href={buildExamTypeDetailPath(sourceExamTypeId)} className={ui('btnSecondary', 'btnSm')}>
            Xem đề thi
          </Link>
        </div>
      );
    }
    return (
      <div className={cx('testList')} role="radiogroup" aria-label="Bài thi đã làm">
        {filteredUserTests.map((t) => (
          <label
            key={t.userTestId}
            className={cx('testItem', { selected: t.userTestId === userTestId, locked: formLocked })}
          >
            <input
              type="radio"
              name="userTestId"
              value={t.userTestId}
              checked={t.userTestId === userTestId}
              onChange={() => setUserTestId(t.userTestId)}
              disabled={formLocked}
            />
            <span className={cx('testText')}>
              <span className={cx('testTitle')}>{t.testTitle || 'Bài thi'}</span>
              <span className={cx('testMeta')}>{formatDate(t.finishedAt)}</span>
            </span>
            {isPracticeAttempt(t) && <span className={ui('pill')}>Luyện theo phần</span>}
            <span className={cx('testScore')}>
              {t.totalScore ?? '-'}
              <small>điểm</small>
            </span>
          </label>
        ))}
      </div>
    );
  };

  return (
    <div className={classNames(planCx('wrapper'), ui('pageRoot'))}>
      <TargetPlanTabs active="plan" examTypeId={sourceExamTypeId} examTypes={examTypes} />
      <header className={ui('pageHead')}>
        <h1 className={ui('pageTitle')}>Sinh lộ trình vượt ải</h1>
        <p className={ui('pageSubtitle')}>
          Lộ trình chia thành các chặng, mỗi chặng là một phần thi. Mỗi chặng gồm nhiều ải luyện ngắn
          về một chủ đề, làm đủ % câu đúng là vượt.
        </p>
      </header>

      <ExamPillPicker
        className={ui('pickerRow')}
        examTypes={examTypes}
        value={sourceExamTypeId}
        onChange={handleSourceExamTypeChange}
      />

      {sourceExamTypeId && targetError && (
        <div className={ui('notice', 'noticeDanger')}>
          <span>Không tải được mục tiêu cho &quot;{sourceExamTypeName || 'kỳ thi này'}&quot;: {targetError}.</span>
          <button type="button" className={ui('btnSecondary', 'btnSm')} onClick={() => refetchTarget()}>
            Thử lại
          </button>
        </div>
      )}

      {isAuthenticated && sourceExamTypeId && !loadingTarget && !targetError && !hasTarget && (
        <div className={ui('notice', planSource === 'SYLLABUS' ? 'noticeInfo' : 'noticeWarning')}>
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
            className={ui('btnPrimary', 'btnSm')}
          >
            Đặt mục tiêu
          </Link>
        </div>
      )}

      <div className={cx('layout')}>
        <form className={classNames(ui('card'), cx('formCard'))} onSubmit={handleSubmit}>
          <ExamHeading exam={sourceExamType} className={cx('examHead')} />

          <div className={cx('block')}>
            <span className={classNames(ui('eyebrow'), cx('blockLabel'))}>Lộ trình dựa trên</span>
            <div className={cx('sourceGrid')} role="radiogroup" aria-label="Lộ trình dựa trên">
              {PLAN_SOURCES.map((option) => {
                const Icon = option.icon;
                const selected = planSource === option.value;
                return (
                  <label
                    key={option.value}
                    className={cx('sourceOption', { selected, locked: !examTypeReady })}
                  >
                    <input
                      type="radio"
                      name="planSource"
                      value={option.value}
                      checked={selected}
                      onChange={() => handlePlanSourceChange(option.value)}
                      disabled={!examTypeReady}
                    />
                    <span className={cx('sourceIcon')} aria-hidden="true">
                      <Icon />
                    </span>
                    <span className={cx('sourceText')}>
                      <span className={cx('sourceTitle')}>{option.title}</span>
                      <span className={cx('sourceSubtitle')}>{option.subtitle}</span>
                      <span className={cx('sourceDesc')}>{option.desc}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {planSource === 'DIAGNOSIS' && (
            <div className={cx('block')}>
              <div className={cx('blockHead')}>
                <span className={ui('eyebrow')}>Chọn bài thi muốn lập lộ trình</span>
                <span className={ui('hint')}>Chỉ hiện bài đã hoàn thành của kỳ thi này.</span>
              </div>
              {renderTestPicker()}
              {isPracticeAttempt(selectedTest) && (
                <p className={cx('practiceWarning')}>
                  <FiAlertTriangle aria-hidden="true" />
                  <span>
                    Bài này chỉ luyện một phần đề nên lộ trình sinh ra chỉ phủ các phần đã luyện.
                    Muốn lộ trình đầy đủ, hãy chọn một bài thi thử trọn đề.
                  </span>
                </p>
              )}
            </div>
          )}

          <div className={cx('submitRow')}>
            <button type="submit" className={ui('btnPrimary')} disabled={submitDisabled}>
              {submitting ? 'Đang sinh lộ trình...' : 'Sinh lộ trình'}
            </button>
            {isGuest && (
              <span className={ui('hint')}>
                <button type="button" className={ui('textBtn')} onClick={requireLogin}>
                  Đăng nhập
                </button>{' '}
                để sinh, lưu và theo dõi tiến độ lộ trình.
              </span>
            )}
          </div>
        </form>

        <aside className={classNames(ui('card'), cx('steps'))} aria-label="Các bước">
          <span className={ui('eyebrow')}>Cách hoạt động</span>
          <ol className={cx('stepList')}>
            <li>
              <span className={cx('stepNum')}>01</span>
              <div>
                <h3>{planSource === 'SYLLABUS' ? 'Chọn kỳ thi muốn học' : 'Chọn bài thi đã làm'}</h3>
                <p>
                  {planSource === 'SYLLABUS'
                    ? 'Chưa làm bài nào cũng được, lộ trình đi theo chương trình của kỳ thi.'
                    : 'Hệ thống chẩn đoán điểm yếu của bạn từ bài này.'}
                </p>
              </div>
            </li>
            <li>
              <span className={cx('stepNum')}>02</span>
              <div>
                <h3>Sinh lộ trình</h3>
                <p>Mỗi chặng là một phần thi, gồm nhiều ải ngắn theo chủ đề.</p>
              </div>
            </li>
            <li>
              <span className={cx('stepNum')}>03</span>
              <div>
                <h3>Vượt ải rồi thi thử</h3>
                <p>Vượt hết ải thì làm bài thi thử để kiểm tra lại và cập nhật lộ trình.</p>
              </div>
            </li>
          </ol>
        </aside>
      </div>

      {(error || userTestsError) && (
        <div className={ui('notice', 'noticeDanger')}>
          <span>{error || userTestsError}</span>
        </div>
      )}

      {result?.targetAchieved && (
        <div className={ui('notice', 'noticeSuccess')}>
          <span>
            <strong>Bạn đã đạt mục tiêu</strong> (mức sẵn sàng {result.baselineReadiness ?? 0}%), chưa cần
            sinh lộ trình mới. Bạn có thể đặt mục tiêu cao hơn trong tab Mục tiêu, hoặc tiếp tục làm bài
            thi thử để duy trì phong độ.
          </span>
        </div>
      )}

      <ConfirmModal
        show={confirmReplaceOpen}
        onClose={() => setConfirmReplaceOpen(false)}
        onConfirm={runGenerate}
        title="Thay lộ trình đang học?"
        confirmText="Sinh lộ trình mới"
        message={
          activePlan
            ? `Bạn đang học Lộ trình ${activePlan.planSequence ?? ''} (${activePlan.passedTasks ?? 0}/${activePlan.totalTasks ?? 0} ải đã vượt). Sinh lộ trình mới sẽ thay thế lộ trình này; lộ trình cũ vẫn được lưu với trạng thái "Đã thay" và có thể chuyển lại sau.`
            : ''
        }
      />

      {isAuthenticated && (
        <LearningPlanList
          loadAll
          allowAllInFilter
          examTypeId={filterExamTypeId}
          onExamTypeIdChange={setFilterExamTypeId}
          initialExamTypeId={examTypeIdFromUrl}
          refreshKey={listRefreshKey}
          showExamTypeBadge
          title="Lộ trình đã sinh"
          emptyMessage={null}
          showRefreshButton={false}
        />
      )}
    </div>
  );
}

export default GeneratePlan;
