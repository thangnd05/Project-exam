'use client';

import Link, { useRouter } from '@/app/i18n/navigation';
import { useSearchParamsState } from '@/app/hooks/useSearchParamsState';
import { examTypeIdFromParams, setExamParam, useNormalizeExamParam } from '@/app/features/exam-types/hooks/useExamParam';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import classNames from 'classnames';
import classNamesBind from 'classnames/bind';
import { TriangleAlert } from 'lucide-react';
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
  labelKey: 'syllabus' | 'diagnosis';
}[] = [
  {
    value: 'SYLLABUS',
    labelKey: 'syllabus',
  },
  {
    value: 'DIAGNOSIS',
    labelKey: 'diagnosis',
  },
];

function GeneratePlan() {
  const t = useTranslations('LearningPlans');
  const router = useRouter();
  const [searchParams, setSearchParams] = useSearchParamsState();
  const { isAuthenticated, loading: authLoading } = useAuth();
  // Khách vẫn xem được trang, chỉ khi bấm thao tác mới bị đưa sang đăng nhập.
  const isGuest = !authLoading && !isAuthenticated;
  const requireLogin = () => router.push(buildLoginUrlFromHere(t('generate.loginRequired')));

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
            (err instanceof Error && err.message) || t('generate.unknownError'),
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
    const tr = t;
    if (isGuest) {
      return (
        <div className={ui('notice', 'noticeInfo')}>
          <span>{t('generate.picker.guestNotice')}</span>
          <button type="button" className={ui('btnPrimary', 'btnSm')} onClick={requireLogin}>
            {t('common.login')}
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
            {t('generate.picker.noTests')}
          </span>
          <Link
            href={sourceExamTypeId ? buildExamTypeDetailPath(sourceExamTypeId) : routes.examTypes}
            className={ui('btnSecondary', 'btnSm')}
          >
            {t('generate.picker.chooseTest')}
          </Link>
        </div>
      );
    }
    if (filteredUserTests.length === 0) {
      return (
        <div className={ui('notice', 'noticeWarning')}>
          <span>
            {t('generate.picker.noTestsForExam', {
              exam: sourceExamTypeName || t('generate.picker.selectedExamFallback'),
            })}
          </span>
          <Link href={buildExamTypeDetailPath(sourceExamTypeId)} className={ui('btnSecondary', 'btnSm')}>
            {t('generate.picker.viewExams')}
          </Link>
        </div>
      );
    }
    return (
      <div className={cx('testList')} role="radiogroup" aria-label={t('generate.picker.ariaLabel')}>
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
              <span className={cx('testTitle')}>{t.testTitle || tr('generate.picker.testFallback')}</span>
              <span className={cx('testMeta')}>{formatDate(t.finishedAt)}</span>
            </span>
            {isPracticeAttempt(t) && <span className={ui('pill')}>{tr('generate.picker.practicePill')}</span>}
            <span className={cx('testScore')}>
              {t.totalScore ?? '-'}
              <small>{tr('generate.picker.points')}</small>
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
        <h1 className={ui('pageTitle')}>{t('generate.title')}</h1>
        <p className={ui('pageSubtitle')}>
          {t('generate.subtitle')}
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
          <span>
            {t('generate.targetError', {
              exam: sourceExamTypeName || t('generate.thisExamFallback'),
              error: targetError,
            })}
          </span>
          <button type="button" className={ui('btnSecondary', 'btnSm')} onClick={() => refetchTarget()}>
            {t('common.retry')}
          </button>
        </div>
      )}

      {isAuthenticated && sourceExamTypeId && !loadingTarget && !targetError && !hasTarget && (
        <div className={ui('notice', planSource === 'SYLLABUS' ? 'noticeInfo' : 'noticeWarning')}>
          <span>
            {t.rich(planSource === 'SYLLABUS' ? 'generate.noTarget.syllabus' : 'generate.noTarget.diagnosis', {
              exam: sourceExamTypeName || t('generate.thisExamFallback'),
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
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
            {t('generate.noTarget.setTarget')}
          </Link>
        </div>
      )}

      <div className={cx('layout')}>
        <form className={classNames(ui('card'), cx('formCard'))} onSubmit={handleSubmit}>
          <ExamHeading exam={sourceExamType} className={cx('examHead')} />

          <div className={cx('block')}>
            <span className={classNames(ui('eyebrow'), cx('blockLabel'))}>{t('generate.form.basedOn')}</span>
            <div className={cx('sourceGrid')} role="radiogroup" aria-label={t('generate.form.basedOn')}>
              {PLAN_SOURCES.map((option) => {
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
                    <span className={cx('sourceText')}>
                      <span className={cx('sourceTitle')}>{t(`generate.sources.${option.labelKey}.title`)}</span>
                      <span className={cx('sourceSubtitle')}>{t(`generate.sources.${option.labelKey}.subtitle`)}</span>
                      <span className={cx('sourceDesc')}>{t(`generate.sources.${option.labelKey}.desc`)}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {planSource === 'DIAGNOSIS' && (
            <div className={cx('block')}>
              <div className={cx('blockHead')}>
                <span className={ui('eyebrow')}>{t('generate.form.pickTest')}</span>
                <span className={ui('hint')}>{t('generate.form.pickTestHint')}</span>
              </div>
              {renderTestPicker()}
              {isPracticeAttempt(selectedTest) && (
                <p className={cx('practiceWarning')}>
                  <TriangleAlert size="1em" aria-hidden="true" />
                  <span>
                    {t('generate.form.practiceWarning')}
                  </span>
                </p>
              )}
            </div>
          )}

          <div className={cx('submitRow')}>
            <button type="submit" className={ui('btnPrimary')} disabled={submitDisabled}>
              {submitting ? t('generate.form.submitting') : t('generate.form.submit')}
            </button>
            {isGuest && (
              <span className={ui('hint')}>
                {t.rich('generate.form.guestHint', {
                  login: (chunks) => (
                    <button type="button" className={ui('textBtn')} onClick={requireLogin}>
                      {chunks}
                    </button>
                  ),
                })}
              </span>
            )}
          </div>
        </form>

        <aside className={classNames(ui('card'), cx('steps'))} aria-label={t('generate.steps.ariaLabel')}>
          <span className={ui('eyebrow')}>{t('generate.steps.heading')}</span>
          <ol className={cx('stepList')}>
            <li>
              <span className={cx('stepNum')}>01</span>
              <div>
                <h3>
                  {planSource === 'SYLLABUS'
                    ? t('generate.steps.step1SyllabusTitle')
                    : t('generate.steps.step1DiagnosisTitle')}
                </h3>
                <p>
                  {planSource === 'SYLLABUS'
                    ? t('generate.steps.step1SyllabusDesc')
                    : t('generate.steps.step1DiagnosisDesc')}
                </p>
              </div>
            </li>
            <li>
              <span className={cx('stepNum')}>02</span>
              <div>
                <h3>{t('generate.steps.step2Title')}</h3>
                <p>{t('generate.steps.step2Desc')}</p>
              </div>
            </li>
            <li>
              <span className={cx('stepNum')}>03</span>
              <div>
                <h3>{t('generate.steps.step3Title')}</h3>
                <p>{t('generate.steps.step3Desc')}</p>
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
            {t.rich('generate.targetAchieved', {
              readiness: result.baselineReadiness ?? 0,
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </span>
        </div>
      )}

      <ConfirmModal
        show={confirmReplaceOpen}
        onClose={() => setConfirmReplaceOpen(false)}
        onConfirm={runGenerate}
        title={t('generate.confirmReplace.title')}
        confirmText={t('common.newPlan')}
        message={
          activePlan
            ? t('generate.confirmReplace.message', {
              sequence: activePlan.planSequence ?? '',
              passed: activePlan.passedTasks ?? 0,
              total: activePlan.totalTasks ?? 0,
            })
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
          title={t('common.listTitle')}
          emptyMessage={null}
          showRefreshButton={false}
        />
      )}
    </div>
  );
}

export default GeneratePlan;
