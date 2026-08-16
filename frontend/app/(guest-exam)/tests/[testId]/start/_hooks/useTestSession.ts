'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { checkActiveUserTest, startUserTest, submitUserTest } from '@/app/apis/userTestApi';
import { getAnswersByUserTest, batchSaveAnswers } from '@/app/apis/userAnswerApi';
import { getUserTestInfo, purchaseTestAccess } from '@/app/apis/testApi';
import { getExamTypeLayout } from '@/app/apis/examTypeApi';
import { resolveLayoutConfig } from '@/app/components/exam-layout/resolveLayoutConfig';
import { defaultLayoutConfig } from '@/app/components/exam-layout/layoutSchema';
import type { ExamUserAnswers } from '@/app/components/exam-layout/examLayoutTypes';
import { getApiErrorMessage } from '@/app/utils/apiError';
import { useAuth } from '@/app/hooks/useAuth';
import { useStreak } from '@/app/hooks/useStreak';
import { useCoins } from '@/app/hooks/useCoins';
import { getOrCreateGuestSessionId, guestHeaders } from '@/app/utils/guestSession';
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

export function useTestSession() {
  const { testId } = useParams<{ testId: string }>();
  const router = useRouter();
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
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [preCountdown, setPreCountdown] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [status, setStatus] = useState('loading');

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

  const loadTest = useCallback(() => {
    const savedState = sessionStorage.getItem(`userTestState-${sessionKey}`);
    let restored = false;
    let savedStartedAt: string | null = null;

    if (savedState) {
      let parsed: any = null;
      try {
        parsed = JSON.parse(savedState);
      } catch {
        sessionStorage.removeItem(`userTestState-${sessionKey}`);
      }
      if (parsed) {
        setUserTestId(parsed.userTestId || null);
        setUserAnswers(parsed.userAnswers || {});

        const savedStep = Number.isInteger(parsed.currentStepIndex)
          ? parsed.currentStepIndex
          : 0;
        const savedMax = Number.isInteger(parsed.maxStepIndex)
          ? parsed.maxStepIndex
          : savedStep;
        flow.restoreStepState(savedStep, savedMax);

        if (typeof parsed.startedAt === 'string') savedStartedAt = parsed.startedAt;
        restored = true;
      }
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
              sessionStorage.setItem(`userTest-${sessionKey}`, activeUserTestId);
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
    if (status === 'open' && test?.testId) {
      const existing = sessionStorage.getItem(`userTest-${sessionKey}`);
      if (existing) {
        setUserTestId(existing);
        try {
          const saved = JSON.parse(
            sessionStorage.getItem(`userTestState-${sessionKey}`) || 'null',
          );
          if (saved?.startedAt) setStartedAt(saved.startedAt);
        } catch {
        }
        setStatus('active');
        return;
      }
      startUserTest(test.testId, isGuest, guestCfg, {
        mode: isPractice ? PRACTICE_MODE_PARAM : undefined,
        examPartIds: isPractice ? selectedPartIds : undefined,
      })
        .then((data) => {
          setUserTestId(data.userTestId ?? null);
          sessionStorage.setItem(`userTest-${sessionKey}`, data.userTestId as string);
          if (!isPractice) setStartedAt(data.startedAt || null);
          setStatus('active');
        })
        .catch((err) => {
          if (err.response?.status === 403) setStatus('no-attempts');
          else setStatus('error');
        });
    }
  }, [status, test, sessionKey, isPractice, selectedPartIds, isGuest, guestCfg]);

  useEffect(() => {
    if (status === 'active' && userTestId) {
      sessionStorage.setItem(
        `userTestState-${sessionKey}`,
        JSON.stringify({
          userTestId,
          userAnswers,
          startedAt,
          currentStepIndex: flow.currentStepIndex,
          maxStepIndex: flow.maxStepIndex,
          lastSavedAt: Date.now(),
        }),
      );
    }
  }, [
    userAnswers,
    startedAt,
    userTestId,
    status,
    sessionKey,
    flow.currentStepIndex,
    flow.maxStepIndex,
  ]);

  useEffect(() => {
    if (status !== 'active' || !userTestId) return undefined;
    const entries = Object.entries(userAnswers);
    if (entries.length === 0) return undefined;
    const handle = setTimeout(() => {
      const payload: UserAnswerRequest[] = entries.map(([qid, ans]) => ({
        userTestId,
        questionId: String(qid),
        selectedAnswerId: ans?.selectedAnswerId || null,
        selectedAnswerIds: ans?.selectedAnswerIds || null,
        answerText: ans?.answerText || null,
      }));
      batchSaveAnswers(payload, isGuest, guestCfg).catch(() => {});
    }, 2000);
    return () => clearTimeout(handle);
  }, [userAnswers, status, userTestId, isGuest, guestCfg]);

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

  const handleSubmit = async () => {
    if (!userTestId || submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const payload: UserAnswerRequest[] = Object.entries(userAnswers).map(([qid, ans]) => ({
        userTestId,
        questionId: String(qid),
        selectedAnswerId: ans.selectedAnswerId || null,
        selectedAnswerIds: ans.selectedAnswerIds || null,
        answerText: ans.answerText || null,
      }));
      if (payload.length > 0) await batchSaveAnswers(payload, isGuest, guestCfg);
      const result = await submitUserTest(userTestId, isGuest, guestCfg);
      sessionStorage.removeItem(`userTest-${sessionKey}`);
      sessionStorage.removeItem(`userTestState-${sessionKey}`);
      if (!isGuest) refreshStreak();
      router.push(`/tests/result/${userTestId}`);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        sessionStorage.removeItem(`userTest-${sessionKey}`);
        sessionStorage.removeItem(`userTestState-${sessionKey}`);
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
    if (status !== 'active') return undefined;
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
  }, [status, deadline]);

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
    handleSubmit,
    handlePurchase,
    isPaged: flow.isPaged,
    flowSteps: flow.flowSteps,
    currentStepIndex: flow.currentStepIndex,
    canGoPrev: flow.canGoPrev,
    goNext: flow.goNext,
    goPrev: flow.goPrev,
    goToStep: flow.goToStep,
    goToQuestion: flow.goToQuestion,
    canNavigateToQuestion: flow.canNavigateToQuestion,
  };
}
