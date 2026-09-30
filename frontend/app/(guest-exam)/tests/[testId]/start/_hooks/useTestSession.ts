'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { generatePlanKeys } from '@/app/hooks/useGeneratePlan';
import { invalidatePlanQueries } from '@/app/hooks/plan-cache';
import { toast } from 'react-toastify';
import { checkActiveUserTest, startUserTest, submitUserTest } from '@/app/apis/userTestApi';
import { getAnswersByUserTest, batchSaveAnswers, sendAnswersOnExit } from '@/app/apis/userAnswerApi';
import { getUserTestInfo, purchaseTestAccess } from '@/app/apis/testApi';
import { getExamTypeLayout } from '@/app/apis/examTypeApi';
import { resolveLayoutConfig } from '@/app/components/exam-layout/resolveLayoutConfig';
import { defaultLayoutConfig } from '@/app/components/exam-layout/layoutSchema';
import type { ExamUserAnswers } from '@/app/components/exam-layout/examLayoutTypes';
import { getApiErrorMessage } from '@/app/utils/apiError';
import { useAuth } from '@/app/hooks/useAuth';
import { useStreak } from '@/app/hooks/useStreak';
import { useStreakRestoreGate } from '@/app/components/gamification/streak/hooks/useStreakRestoreGate';
import { useCoins } from '@/app/hooks/useCoins';
import { getOrCreateGuestSessionId, guestHeaders } from '@/app/utils/guestSession';
import {
  clearExamSession,
  pruneExpiredExamSessions,
  readExamSessionId,
  readExamSessionState,
  writeExamSessionId,
  writeExamSessionState,
} from '@/app/utils/examStorage';
import type { UserTestMode } from '@/app/enums';
import type { TestPartResponse, TestResponse, UserAnswerRequest } from '@/app/types';
import { enrichTestWithPassageMedia } from './passageUtils';
import { useExamFlowNavigation } from './useExamFlowNavigation';

type ActiveTest = Omit<TestResponse, 'testId' | 'status'> & {
  testId?: string;
  status?: string;
  parts: TestPartResponse[];
};

const PRACTICE_MODE_PARAM = 'practice' as UserTestMode;
const AUTOSAVE_INTERVAL_MS = 60000;

export function useTestSession() {
  const { testId } = useParams<{ testId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  // Bài vừa nộp phải hiện ngay ở trang sinh lộ trình và dashboard mục tiêu.
  const invalidateAfterSubmit = () => {
    queryClient.invalidateQueries({ queryKey: generatePlanKeys.userTests });
    invalidatePlanQueries(queryClient);
  };
  const searchParams = useSearchParams();

  const isPractice = searchParams.get('mode') === 'practice';
  const partsParam = searchParams.get('parts') || '';
  const selectedPartIds = useMemo(
    () => (partsParam ? partsParam.split(',').filter(Boolean) : []),
    [partsParam],
  );

  const sessionKey = useMemo(() => {
    if (!isPractice) return testId;
    return `${testId}::practice::${[...selectedPartIds].sort().join(',')}`;
  }, [testId, isPractice, selectedPartIds]);

  const { isAuthenticated, loading: authLoading } = useAuth();
  const { refreshStreak } = useStreak();
  const { blocked: streakRestoreBlocked, allow: allowStreakRestore, streakReady } = useStreakRestoreGate();
  const { balance, refreshCoins } = useCoins();
  const [purchasing, setPurchasing] = useState(false);

  const isGuest = !authLoading && !isAuthenticated;
  const guestSessionId = useMemo(
    () => (isGuest ? getOrCreateGuestSessionId() : null),
    [isGuest],
  );
  const guestCfg = useMemo(
    () => (isGuest ? { headers: guestHeaders(guestSessionId) } : {}),
    [isGuest, guestSessionId],
  );

  const [userTestId, setUserTestId] = useState<string | null>(null);
  const [test, setTest] = useState<ActiveTest>({ parts: [] });
  const [userAnswers, setUserAnswers] = useState<ExamUserAnswers>({});
  // Đánh dấu câu chỉ lưu ở localStorage cùng phiên thi, nộp bài là xoá theo.
  const [flaggedQuestionIds, setFlaggedQuestionIds] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [preCountdown, setPreCountdown] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [status, setStatus] = useState('loading');
  // Bài thi tính giờ phải bấm "Bắt đầu" ở màn sẵn sàng rồi mới tạo lượt làm, lúc đó đồng hồ mới chạy.
  const [readyConfirmed, setReadyConfirmed] = useState(isPractice);
  const examCanStart = status === 'open' || status === 'active';
  const holdStart = isAuthenticated && examCanStart && (!streakReady || streakRestoreBlocked);

  const visibleParts = useMemo(() => {
    const parts = test.parts || [];
    if (!isPractice || selectedPartIds.length === 0) return parts;
    const set = new Set(selectedPartIds);
    return parts.filter((p) => set.has(p.examPartId as string));
  }, [test.parts, isPractice, selectedPartIds]);

  const { data: layoutConfig = defaultLayoutConfig } = useQuery({
    queryKey: ['exam-type-layout', test?.examTypeId],
    queryFn: async () => {
      try {
        const res = await getExamTypeLayout(test.examTypeId as string);
        return resolveLayoutConfig(res);
      } catch {
        return defaultLayoutConfig;
      }
    },
    enabled: Boolean(test?.examTypeId),
    staleTime: 5 * 60 * 1000,
    placeholderData: defaultLayoutConfig,
  });

  const flow = useExamFlowNavigation({ visibleParts, layoutConfig });

  const userAnswersRef = useRef(userAnswers);
  const pendingSinceRef = useRef<number | null>(null);

  useEffect(() => {
    userAnswersRef.current = userAnswers;
  }, [userAnswers]);

  const buildAnswersPayload = useCallback((): UserAnswerRequest[] => {
    if (!userTestId) return [];
    return Object.entries(userAnswersRef.current).map(([qid, ans]) => ({
      userTestId,
      questionId: String(qid),
      selectedAnswerId: ans?.selectedAnswerId || null,
      selectedAnswerIds: ans?.selectedAnswerIds || null,
      answerText: ans?.answerText || null,
    }));
  }, [userTestId]);

  const loadTest = useCallback(() => {
    pruneExpiredExamSessions();

    const savedState = readExamSessionState(sessionKey);
    let restored = false;
    let savedStartedAt: string | null = null;

    if (savedState) {
      setUserTestId(savedState.userTestId);
      setUserAnswers(savedState.userAnswers);
      setFlaggedQuestionIds(savedState.flaggedQuestionIds);
      flow.restoreStepState(savedState.currentStepIndex, savedState.maxStepIndex);
      savedStartedAt = savedState.startedAt;
      restored = true;

      // Bản local có thể mới hơn server nếu lần lưu trước thất bại.
      if (Object.keys(savedState.userAnswers).length > 0) pendingSinceRef.current = Date.now();
    }

    getUserTestInfo(testId)
      .then(async (testInfoData) => {
        const testData: ActiveTest = { ...testInfoData, parts: testInfoData.parts || [] };
        const enriched = await enrichTestWithPassageMedia(testData);
        setTest(enriched);

        if (testData.status === 'LOGIN_REQUIRED') {
          router.push(
            `/login?${new URLSearchParams({
              from: `/tests/${testId}/start`,
              flash: 'Bạn cần đăng nhập để làm bài thi này!',
            }).toString()}`,
          );
          return;
        }

        if (testData.status === 'PAYMENT_REQUIRED') {
          setStatus('payment');
          return;
        }

        if (testData.canDoTest === false || testData.status === 'FORBIDDEN') {
          setStatus('no-attempts');
          return;
        }

        const now = new Date();
        const availableFrom = testData.availableFrom
          ? new Date(testData.availableFrom)
          : null;
        const availableTo = testData.availableTo
          ? new Date(testData.availableTo)
          : null;

        if (availableFrom && now < availableFrom) {
          setStatus('locked');
          setPreCountdown(Math.floor((availableFrom.getTime() - now.getTime()) / 1000));
          return;
        }

        let serverStartedAt: string | null = null;

        const needStartedAt = !isPractice && !savedStartedAt;
        if (!restored || needStartedAt) {
          try {
            const active = await checkActiveUserTest(testId, isGuest, guestCfg, {
              mode: isPractice ? PRACTICE_MODE_PARAM : undefined,
              examPartIds: isPractice ? selectedPartIds : undefined,
            });
            const activeUserTestId = active?.userTestId;
            if (activeUserTestId) {
              serverStartedAt = active?.startedAt || null;

              if (!restored) {
                const answers = await getAnswersByUserTest(
                  activeUserTestId,
                  isGuest,
                  guestCfg,
                );
                const answersMap: ExamUserAnswers = {};
                (answers || []).forEach((a) => {
                  answersMap[a.questionId as string] = {
                    selectedAnswerId: a.selectedAnswerId || null,
                    selectedAnswerIds: a.selectedAnswerIds || null,
                    answerText: a.answerText || null,
                  };
                });
                setUserTestId(activeUserTestId);
                setUserAnswers(answersMap);
              }
              writeExamSessionId(sessionKey, activeUserTestId);
              restored = true;
            }
          } catch (err) {
            console.error('Failed to restore in-progress answers:', err);
          }
        }

        if (availableTo && now > availableTo && !restored) {
          setStatus('closed');
          return;
        }

        if (!restored) {
          setStatus('open');
        } else {
          setStartedAt(savedStartedAt || serverStartedAt || null);
          setStatus('active');
        }
      })
      .catch(() => setStatus('error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId, sessionKey, isPractice, selectedPartIds, router, isGuest, guestCfg]);

  useEffect(() => {
    if (!testId || authLoading) return;
    loadTest();
  }, [testId, authLoading, loadTest]);

  useEffect(() => {
    if (holdStart) return;
    if (status === 'open' && test?.testId) {
      const existing = readExamSessionId(sessionKey);
      if (existing) {
        setUserTestId(existing);
        const saved = readExamSessionState(sessionKey);
        if (saved?.startedAt) setStartedAt(saved.startedAt);
        setStatus('active');
        return;
      }
      if (!readyConfirmed) {
        setStatus('ready');
        return;
      }
      startUserTest(test.testId, isGuest, guestCfg, {
        mode: isPractice ? PRACTICE_MODE_PARAM : undefined,
        examPartIds: isPractice ? selectedPartIds : undefined,
      })
        .then((data) => {
          setUserTestId(data.userTestId ?? null);
          writeExamSessionId(sessionKey, data.userTestId as string);
          if (!isPractice) setStartedAt(data.startedAt || null);
          setStatus('active');
        })
        .catch((err) => {
          if (err.response?.status === 403) setStatus('no-attempts');
          else setStatus('error');
        });
    }
  }, [status, test, sessionKey, isPractice, selectedPartIds, isGuest, guestCfg, holdStart, readyConfirmed]);

  const confirmReady = useCallback(() => {
    setReadyConfirmed(true);
    setStatus('open');
  }, []);

  useEffect(() => {
    if (status === 'active' && userTestId) {
      writeExamSessionState(sessionKey, {
        userTestId,
        userAnswers,
        startedAt,
        currentStepIndex: flow.currentStepIndex,
        maxStepIndex: flow.maxStepIndex,
        flaggedQuestionIds,
      });
    }
  }, [
    userAnswers,
    flaggedQuestionIds,
    startedAt,
    userTestId,
    status,
    sessionKey,
    flow.currentStepIndex,
    flow.maxStepIndex,
  ]);

  useEffect(() => {
    if (status !== 'active' || !userTestId) return undefined;

    const timer = setInterval(() => {
      if (pendingSinceRef.current === null) return;
      const payload = buildAnswersPayload();
      if (payload.length === 0) return;

      pendingSinceRef.current = null;
      batchSaveAnswers(payload, isGuest, guestCfg).catch((err) => {
        const httpStatus = err?.response?.status;
        // 4xx nghĩa là bài đã nộp hoặc hết giờ, thử lại cũng vô ích.
        if (!(httpStatus >= 400 && httpStatus < 500)) pendingSinceRef.current = Date.now();
      });
    }, AUTOSAVE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [status, userTestId, isGuest, guestCfg, buildAnswersPayload]);

  useEffect(() => {
    if (status !== 'active' || !userTestId) return undefined;

    const flush = () => {
      if (submittingRef.current || pendingSinceRef.current === null) return;
      const payload = buildAnswersPayload();
      if (payload.length === 0) return;
      pendingSinceRef.current = null;
      sendAnswersOnExit(payload, isGuest, guestSessionId);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [status, userTestId, isGuest, guestSessionId, buildAnswersPayload]);

  useEffect(() => {
    if (status === 'locked' && preCountdown !== null) {
      if (preCountdown <= 0) {
        setStatus('open');
        return undefined;
      }
      const timer = setInterval(() => setPreCountdown((p) => (p as number) - 1), 1000);
      return () => clearInterval(timer);
    }
    return undefined;
  }, [preCountdown, status]);

  const handleAnswerChange = (questionId: string, type: string, value: string) => {
    if (pendingSinceRef.current === null) pendingSinceRef.current = Date.now();
    setUserAnswers((prev) => {
      if (type === 'MSQ') {
        const current = prev[questionId]?.selectedAnswerIds || [];
        const next = current.includes(value)
          ? current.filter((x) => x !== value)
          : [...current, value];
        return { ...prev, [questionId]: { selectedAnswerIds: next } };
      }
      const updatedAnswer =
        type === 'MCQ' ? { selectedAnswerId: value } : { answerText: value };
      return { ...prev, [questionId]: updatedAnswer };
    });
  };

  const toggleFlag = useCallback((questionId: string) => {
    setFlaggedQuestionIds((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId],
    );
  }, []);

  const handleSubmit = async () => {
    if (!userTestId || submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      pendingSinceRef.current = null;
      const payload = buildAnswersPayload();
      if (payload.length > 0) await batchSaveAnswers(payload, isGuest, guestCfg);
      const result = await submitUserTest(userTestId, isGuest, guestCfg);
      clearExamSession(sessionKey);
      if (!isGuest) refreshStreak();
      invalidateAfterSubmit();
      router.push(`/tests/result/${userTestId}`);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        clearExamSession(sessionKey);
        invalidateAfterSubmit();
        router.push(`/tests/result/${userTestId}`);
        return;
      }
      toast.error(getApiErrorMessage(err, 'Nộp bài thất bại! Vui lòng thử lại.'));
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleSubmitRef = useRef<(() => Promise<void>) | undefined>(undefined);
  handleSubmitRef.current = handleSubmit;

  const deadline = useMemo(() => {
    if (isPractice || !startedAt) return null;
    const durationMinutes = test?.durationMinutes;
    const durationSec =
      durationMinutes && durationMinutes > 0 ? durationMinutes * 60 : null;
    let end =
      durationSec !== null ? new Date(startedAt).getTime() + durationSec * 1000 : null;
    const availableToMs = test?.availableTo ? new Date(test.availableTo).getTime() : null;
    if (availableToMs !== null && (end === null || availableToMs < end)) end = availableToMs;
    return end;
  }, [isPractice, startedAt, test?.durationMinutes, test?.availableTo]);

  useEffect(() => {
    if (status !== 'active' || holdStart) return undefined;
    if (deadline == null) {
      setTimeLeft(null);
      return undefined;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        if (!submittingRef.current) handleSubmitRef.current?.();
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [status, deadline, holdStart]);

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      await purchaseTestAccess(testId);
      await refreshCoins();
      toast.success('Đã mở khoá bài kiểm tra!');
      setStatus('loading');
      loadTest();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Mở khoá thất bại. Vui lòng thử lại.'));
    } finally {
      setPurchasing(false);
    }
  };

  const retryLoad = () => {
    setStatus('loading');
    loadTest();
  };

  return {
    isPractice,
    status,
    test,
    layoutConfig,
    userAnswers,
    timeLeft,
    preCountdown,
    isSubmitting,
    purchasing,
    balance,
    visibleParts,
    allQuestions: flow.allQuestions,
    questionIndexMap: flow.questionIndexMap,
    handleAnswerChange,
    flaggedQuestionIds,
    toggleFlag,
    handleSubmit,
    handlePurchase,
    retryLoad,
    confirmReady,
    isPaged: flow.isPaged,
    flowSteps: flow.flowSteps,
    currentStepIndex: flow.currentStepIndex,
    canGoPrev: flow.canGoPrev,
    goNext: flow.goNext,
    goPrev: flow.goPrev,
    goToStep: flow.goToStep,
    goToQuestion: flow.goToQuestion,
    canNavigateToQuestion: flow.canNavigateToQuestion,
    streakRestoreBlocked,
    allowStreakRestore,
    holdStart,
  };
}
