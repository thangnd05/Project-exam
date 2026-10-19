'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useLayoutEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { invalidatePlanQueries } from '@/app/features/learning-plans/plan-cache';
import { toast } from 'react-toastify';
import { checkActiveUserTest, startUserTest, submitUserTest } from '@/app/apis/userTestApi';
import { getAnswersByUserTest, batchSaveAnswers, sendAnswersOnExit } from '@/app/apis/userAnswerApi';
import { getUserTestInfo, purchaseTestAccess } from '@/app/apis/testApi';
import { getExamTypeLayout } from '@/app/apis/examTypeApi';
import { resolveLayoutConfig } from '@/app/features/exam-layout/resolveLayoutConfig';
import { defaultLayoutConfig } from '@/app/features/exam-layout/layoutSchema';
import type { ExamUserAnswers } from '@/app/features/exam-layout/examLayoutTypes';
import { getApiErrorMessage } from '@/app/utils/apiError';
import { useAuth } from '@/app/hooks/useAuth';
import { useStreak } from '@/app/features/gamification/streak/hooks/useStreak';
import { useStreakRestoreGate } from '@/app/features/gamification/streak/hooks/useStreakRestoreGate';
import { useCoins } from '@/app/features/gamification/coin/hooks/useCoins';
import { getOrCreateGuestSessionId, guestHeaders } from '@/app/utils/guestSession';
import {
  clearExamSession,
  pruneExpiredExamSessions,
  readExamSessionId,
  readExamSessionState,
  writeExamSessionId,
  writeExamSessionState,
} from '@/app/(guest-exam)/tests/[testId]/start/_lib/examStorage';
import { clockMark, serverNowMs, syncServerClock } from '@/app/(guest-exam)/tests/[testId]/start/_lib/serverClock';
import type { UserTestMode } from '@/app/enums';
import type {
  ActiveUserTestResponse,
  TestPartResponse,
  TestResponse,
  UserAnswerRequest,
  UserAnswerResponse,
} from '@/app/types';
import { enrichTestWithPassageMedia } from '@/app/(guest-exam)/tests/[testId]/start/_lib/passageUtils';
import { useExamFlowNavigation } from './useExamFlowNavigation';
import {examTypeKeys, completedUserTestKeys} from '@/app/configs/queryKeys';

type ActiveTest = Omit<TestResponse, 'testId' | 'status'> & {
  testId?: string;
  status?: string;
  parts: TestPartResponse[];
};

const PRACTICE_MODE_PARAM = 'practice' as UserTestMode;
const AUTOSAVE_INTERVAL_MS = 60000;
const AUTO_SUBMIT_RETRY_MS = [2000, 4000, 8000, 15000];
const AUTO_SUBMIT_RETRY_TOAST_ID = 'auto-submit-retry';

type AnswerValue = ExamUserAnswers[string];

const getHttpStatus = (err: unknown): number | undefined =>
  (err as { response?: { status?: number } } | null)?.response?.status;

// Mất mạng / server tạm lỗi thì thử lại được; 4xx là bài đã nộp hoặc hết giờ, thử lại cũng vô ích.
const isRetryableError = (err: unknown): boolean => {
  const httpStatus = getHttpStatus(err);
  return !httpStatus || httpStatus >= 500 || httpStatus === 408 || httpStatus === 429;
};

const toAnswersMap = (answers: UserAnswerResponse[] | null | undefined): ExamUserAnswers => {
  const map: ExamUserAnswers = {};
  (answers || []).forEach((a) => {
    map[a.questionId as string] = {
      selectedAnswerId: a.selectedAnswerId || null,
      selectedAnswerIds: a.selectedAnswerIds || null,
      answerText: a.answerText || null,
    };
  });
  return map;
};

// Server là bản chuẩn: chỉ giữ đáp án local của những câu sửa ở máy này mà chưa lưu được lên server.
// Bản lưu cũ không ghi lại câu nào chưa lưu, nên chỉ lấy những câu server chưa có
// để không ghi đè đáp án mới hơn đã làm ở máy/tab khác.
const mergeLocalAnswers = (
  server: ExamUserAnswers,
  local: ExamUserAnswers,
  localDirty: string[] | null,
): { answers: ExamUserAnswers; dirty: string[] } => {
  const dirty = (localDirty ?? Object.keys(local).filter((qid) => !(qid in server)))
    .filter((qid) => qid in local);
  const answers = { ...server };
  dirty.forEach((qid) => {
    answers[qid] = local[qid];
  });
  return { answers, dirty };
};

export function useTestSession() {
  const { testId } = useParams<{ testId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  // Bài vừa nộp phải hiện ngay ở trang sinh lộ trình và dashboard mục tiêu.
  const invalidateAfterSubmit = () => {
    queryClient.invalidateQueries({ queryKey: completedUserTestKeys.all });
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
  // Effect tạo lượt làm chạy lại mỗi khi deps đổi (hoặc 2 lần ở StrictMode) trong lúc request đầu chưa trả về.
  const startingRef = useRef(false);
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
    queryKey: examTypeKeys.resolvedLayout(test?.examTypeId),
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
  // Câu đã sửa nhưng server chưa xác nhận lưu. Chỉ gửi những câu này, để bản cũ còn trong
  // localStorage không ghi đè đáp án mới hơn trên server.
  const dirtyRef = useRef<Set<string>>(new Set());
  const [dirtyVersion, setDirtyVersion] = useState(0);
  const autoSubmitRetryRef = useRef<{ timer: ReturnType<typeof setTimeout> | null; attempt: number }>({
    timer: null,
    attempt: 0,
  });

  useEffect(() => {
    userAnswersRef.current = userAnswers;
  }, [userAnswers]);

  const replaceDirty = useCallback((questionIds: Iterable<string>) => {
    dirtyRef.current = new Set(questionIds);
    setDirtyVersion((v) => v + 1);
  }, []);

  // Chụp đáp án đang chờ lưu; lưu xong chỉ bỏ cờ những câu không bị sửa tiếp trong lúc chờ phản hồi.
  const takeDirtySnapshot = useCallback((): Map<string, AnswerValue> => {
    const snapshot = new Map<string, AnswerValue>();
    dirtyRef.current.forEach((qid) => snapshot.set(qid, userAnswersRef.current[qid]));
    return snapshot;
  }, []);

  const markSaved = useCallback((snapshot: Map<string, AnswerValue>) => {
    let changed = false;
    snapshot.forEach((ans, qid) => {
      if (userAnswersRef.current[qid] === ans && dirtyRef.current.delete(qid)) changed = true;
    });
    if (changed) setDirtyVersion((v) => v + 1);
  }, []);

  const buildAnswersPayload = useCallback(
    (snapshot: Map<string, AnswerValue>): UserAnswerRequest[] => {
      if (!userTestId) return [];
      return Array.from(snapshot, ([qid, ans]) => ({
        userTestId,
        questionId: String(qid),
        selectedAnswerId: ans?.selectedAnswerId || null,
        selectedAnswerIds: ans?.selectedAnswerIds || null,
        answerText: ans?.answerText || null,
      }));
    },
    [userTestId],
  );

  const orderedForRef = useRef<string | null>(null);

  const applyAttemptOrder = useCallback(
    async (attemptId: string) => {
      if (orderedForRef.current === attemptId) return;
      const data = await getUserTestInfo(testId, { userTestId: attemptId, guestSessionId });
      const enriched = await enrichTestWithPassageMedia({ ...data, parts: data.parts || [] });
      orderedForRef.current = attemptId;
      setTest((prev) => ({ ...prev, parts: enriched.parts }));
    },
    [testId, guestSessionId],
  );

  // Mỗi lần tải đề tăng số thứ tự; phản hồi của lần tải cũ (deps đổi, unmount, bấm thử lại) bị bỏ qua.
  const loadSeqRef = useRef(0);

  const loadTest = useCallback(() => {
    loadSeqRef.current += 1;
    const seq = loadSeqRef.current;
    const isStale = () => seq !== loadSeqRef.current;

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

      // Tạm dùng bản local (vd. đang mất mạng); có dữ liệu server thì gộp lại bên dưới.
      replaceDirty(savedState.dirtyQuestionIds ?? Object.keys(savedState.userAnswers));
    }

    const savedAttemptId = savedState?.userTestId || readExamSessionId(sessionKey) || null;
    getUserTestInfo(testId, { userTestId: savedAttemptId, guestSessionId })
      .then(async (testInfoData) => {
        if (isStale()) return;
        const testData: ActiveTest = { ...testInfoData, parts: testInfoData.parts || [] };
        const enriched = await enrichTestWithPassageMedia(testData);
        if (isStale()) return;
        orderedForRef.current = testData.shuffleQuestions ? savedAttemptId : null;
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

        // Luôn hỏi server: vừa lấy lượt đang làm, vừa lấy serverNow để đồng hồ thi chạy theo giờ server.
        let active: ActiveUserTestResponse | null = null;
        try {
          const requestedAt = clockMark();
          active = await checkActiveUserTest(testId, isGuest, guestCfg, {
            mode: isPractice ? PRACTICE_MODE_PARAM : undefined,
            examPartIds: isPractice ? selectedPartIds : undefined,
          });
          syncServerClock(active?.serverNow, requestedAt);
        } catch (err) {
          console.error('Failed to check in-progress attempt:', err);
        }
        if (isStale()) return;

        const nowMs = serverNowMs();
        const availableFromMs = testData.availableFrom
          ? new Date(testData.availableFrom).getTime()
          : null;
        const availableToMs = testData.availableTo
          ? new Date(testData.availableTo).getTime()
          : null;

        if (availableFromMs !== null && nowMs < availableFromMs) {
          setStatus('locked');
          setPreCountdown(Math.floor((availableFromMs - nowMs) / 1000));
          return;
        }

        let serverStartedAt: string | null = null;
        const activeUserTestId = active?.userTestId;
        if (activeUserTestId) {
          try {
            const serverAnswers = toAnswersMap(
              await getAnswersByUserTest(activeUserTestId, isGuest, guestCfg),
            );
            if (isStale()) return;
            const sameAttempt = savedState?.userTestId === activeUserTestId;
            const merged = sameAttempt
              ? mergeLocalAnswers(serverAnswers, savedState.userAnswers, savedState.dirtyQuestionIds)
              : { answers: serverAnswers, dirty: [] };

            if (savedState && !sameAttempt) {
              // Bản local thuộc lượt làm khác (đã kết thúc): bỏ, theo lượt server đang mở.
              setFlaggedQuestionIds([]);
              flow.restoreStepState(0, 0);
              savedStartedAt = null;
            }
            setUserTestId(activeUserTestId);
            setUserAnswers(merged.answers);
            replaceDirty(merged.dirty);
            serverStartedAt = active?.startedAt || null;
            writeExamSessionId(sessionKey, activeUserTestId);
            restored = true;
          } catch (err) {
            console.error('Failed to restore in-progress answers:', err);
          }
          if (isStale()) return;
        }

        if (availableToMs !== null && nowMs > availableToMs && !restored) {
          setStatus('closed');
          return;
        }

        if (!restored) {
          setStatus('open');
        } else {
          // Giờ bắt đầu do server ghi nhận là chuẩn; bản local chỉ dùng khi không hỏi được server.
          setStartedAt(serverStartedAt || savedStartedAt || null);
          setStatus('active');
        }
      })
      .catch(() => {
        if (!isStale()) setStatus('error');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId, sessionKey, isPractice, selectedPartIds, router, isGuest, guestCfg]);

  useEffect(() => {
    if (!testId || authLoading) return undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- khôi phục phiên thi từ localStorage (chỉ đọc được phía client) rồi gọi API
    loadTest();
    return () => {
      // Huỷ lần tải đang chạy để phản hồi cũ không ghi đè state của lần tải mới.
      loadSeqRef.current += 1;
    };
  }, [testId, authLoading, loadTest]);

  useEffect(() => {
    if (holdStart) return;
    if (status === 'open' && test?.testId) {
      const existing = readExamSessionId(sessionKey);
      if (existing) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- máy trạng thái phiên thi: lượt làm đã lưu trong localStorage thì vào thẳng bài
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
      if (startingRef.current) return;
      startingRef.current = true;
      const requestedAt = clockMark();
      startUserTest(test.testId, isGuest, guestCfg, {
        mode: isPractice ? PRACTICE_MODE_PARAM : undefined,
        examPartIds: isPractice ? selectedPartIds : undefined,
      })
        .then(async (data) => {
          syncServerClock(data.serverNow, requestedAt);
          if (test.shuffleQuestions && data.userTestId) {
            await applyAttemptOrder(data.userTestId).catch((err) =>
              console.error('Failed to load shuffled question order:', err),
            );
          }
          setUserTestId(data.userTestId ?? null);
          writeExamSessionId(sessionKey, data.userTestId as string);
          if (!isPractice) setStartedAt(data.startedAt || null);
          setStatus('active');
        })
        .catch((err) => {
          if (err.response?.status === 403) setStatus('no-attempts');
          else setStatus('error');
        })
        .finally(() => {
          startingRef.current = false;
        });
    }
  }, [status, test, sessionKey, isPractice, selectedPartIds, isGuest, guestCfg, holdStart, readyConfirmed, applyAttemptOrder]);

  useEffect(() => {
    if (status !== 'active' || !userTestId || !test.shuffleQuestions) return;
    applyAttemptOrder(userTestId).catch((err) =>
      console.error('Failed to load shuffled question order:', err),
    );
  }, [status, userTestId, test.shuffleQuestions, applyAttemptOrder]);

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
        dirtyQuestionIds: Array.from(dirtyRef.current),
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
    dirtyVersion,
  ]);

  useEffect(() => {
    if (status !== 'active' || !userTestId) return undefined;

    const timer = setInterval(() => {
      if (submittingRef.current || dirtyRef.current.size === 0) return;
      const snapshot = takeDirtySnapshot();
      batchSaveAnswers(buildAnswersPayload(snapshot), isGuest, guestCfg)
        .then(() => markSaved(snapshot))
        .catch((err) => {
          // Bài đã nộp hoặc hết giờ: không lưu được nữa, bỏ cờ để khỏi gửi lại mãi.
          if (!isRetryableError(err)) markSaved(snapshot);
        });
    }, AUTOSAVE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [status, userTestId, isGuest, guestCfg, buildAnswersPayload, takeDirtySnapshot, markSaved]);

  useEffect(() => {
    if (status !== 'active' || !userTestId) return undefined;

    const flush = () => {
      if (submittingRef.current || dirtyRef.current.size === 0) return;
      const snapshot = takeDirtySnapshot();
      // Đóng tab thì không biết kết quả; câu vẫn giữ cờ chưa lưu cho tới khi server xác nhận.
      sendAnswersOnExit(buildAnswersPayload(snapshot), isGuest, guestSessionId).then((ok) => {
        if (ok) markSaved(snapshot);
      });
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
  }, [status, userTestId, isGuest, guestSessionId, buildAnswersPayload, takeDirtySnapshot, markSaved]);

  useEffect(() => {
    if (status === 'locked' && preCountdown !== null) {
      if (preCountdown <= 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- máy trạng thái phiên thi: đếm ngược giờ mở đề về 0 thì mở bài
        setStatus('open');
        return undefined;
      }
      const timer = setInterval(() => setPreCountdown((p) => (p as number) - 1), 1000);
      return () => clearInterval(timer);
    }
    return undefined;
  }, [preCountdown, status]);

  const handleAnswerChange = (questionId: string, type: string, value: string) => {
    const prev = userAnswersRef.current;
    let updatedAnswer: AnswerValue;
    if (type === 'MSQ') {
      const current = prev[questionId]?.selectedAnswerIds || [];
      updatedAnswer = {
        selectedAnswerIds: current.includes(value)
          ? current.filter((x) => x !== value)
          : [...current, value],
      };
    } else {
      updatedAnswer = type === 'MCQ' ? { selectedAnswerId: value } : { answerText: value };
    }
    // Cập nhật ref ngay (không đợi render) để markSaved so đúng với đáp án mới nhất.
    const next = { ...prev, [questionId]: updatedAnswer };
    userAnswersRef.current = next;
    dirtyRef.current.add(questionId);
    setUserAnswers(next);
  };

  const toggleFlag = useCallback((questionId: string) => {
    setFlaggedQuestionIds((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId],
    );
  }, []);

  const clearAutoSubmitRetry = () => {
    const retry = autoSubmitRetryRef.current;
    if (retry.timer) clearTimeout(retry.timer);
    retry.timer = null;
    retry.attempt = 0;
    toast.dismiss(AUTO_SUBMIT_RETRY_TOAST_ID);
  };

  // Gọi khi đã giữ cờ submittingRef. auto = tự nộp lúc hết giờ: lỗi mạng thì tự thử lại thay vì bỏ cuộc.
  const runSubmit = async (auto: boolean) => {
    if (!userTestId) return;
    try {
      const snapshot = takeDirtySnapshot();
      if (snapshot.size > 0) {
        try {
          await batchSaveAnswers(buildAnswersPayload(snapshot), isGuest, guestCfg);
          markSaved(snapshot);
        } catch (err) {
          // 4xx (hết giờ / đã nộp): đáp án không lưu thêm được nữa, vẫn nộp để chốt bài với phần đã lưu.
          if (isRetryableError(err)) throw err;
        }
      }
      await submitUserTest(userTestId, isGuest, guestCfg);
      clearAutoSubmitRetry();
      clearExamSession(sessionKey);
      if (!isGuest) refreshStreak();
      invalidateAfterSubmit();
      router.push(`/tests/result/${userTestId}`);
    } catch (err: unknown) {
      if (getHttpStatus(err) === 409) {
        clearAutoSubmitRetry();
        clearExamSession(sessionKey);
        invalidateAfterSubmit();
        router.push(`/tests/result/${userTestId}`);
        return;
      }
      if (auto && isRetryableError(err)) {
        const retry = autoSubmitRetryRef.current;
        const delay = AUTO_SUBMIT_RETRY_MS[Math.min(retry.attempt, AUTO_SUBMIT_RETRY_MS.length - 1)];
        retry.attempt += 1;
        toast.warning('Mất kết nối khi nộp bài. Đang tự thử nộp lại, đừng đóng trang...', {
          toastId: AUTO_SUBMIT_RETRY_TOAST_ID,
          autoClose: false,
        });
        // Vẫn giữ trạng thái đang nộp để người dùng không sửa / bấm nộp chồng lên.
        retry.timer = setTimeout(() => {
          retry.timer = null;
          void runSubmitRef.current?.(true);
        }, delay);
        return;
      }
      clearAutoSubmitRetry();
      toast.error(getApiErrorMessage(err, 'Nộp bài thất bại! Vui lòng thử lại.'));
    }
    submittingRef.current = false;
    setIsSubmitting(false);
  };

  const runSubmitRef = useRef<((auto: boolean) => Promise<void>) | undefined>(undefined);

  const startSubmit = async (auto: boolean) => {
    if (!userTestId || submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    await runSubmit(auto);
  };

  const handleSubmit = () => startSubmit(false);

  const autoSubmitRef = useRef<(() => Promise<void>) | undefined>(undefined);

  // Cập nhật ref sau mỗi lần commit, trước mọi effect / timer, để timer luôn gọi bản hàm mới nhất.
  useLayoutEffect(() => {
    runSubmitRef.current = runSubmit;
    autoSubmitRef.current = () => startSubmit(true);
  });

  // Có mạng lại thì nộp ngay, không chờ hết lượt chờ.
  useEffect(() => {
    const retry = autoSubmitRetryRef.current;
    const handleOnline = () => {
      if (!retry.timer) return;
      clearTimeout(retry.timer);
      retry.timer = null;
      void runSubmitRef.current?.(true);
    };
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
      if (retry.timer) clearTimeout(retry.timer);
    };
  }, []);

  const deadline = useMemo(() => {
    if (isPractice || !startedAt) return null;
    const durationMinutes = test.durationMinutes;
    const durationSec =
      durationMinutes && durationMinutes > 0 ? durationMinutes * 60 : null;
    let end =
      durationSec !== null ? new Date(startedAt).getTime() + durationSec * 1000 : null;
    const availableToMs = test.availableTo ? new Date(test.availableTo).getTime() : null;
    if (availableToMs !== null && (end === null || availableToMs < end)) end = availableToMs;
    return end;
  }, [isPractice, startedAt, test.durationMinutes, test.availableTo]);

  useEffect(() => {
    if (status !== 'active' || holdStart || deadline == null) return undefined;

    const tick = () => {
      // So với giờ server, không phải giờ máy người dùng (có thể chạy nhanh/chậm).
      const remaining = Math.max(0, Math.round((deadline - serverNowMs()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        if (!submittingRef.current) autoSubmitRef.current?.();
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [status, deadline, holdStart]);

  // Máy ngủ / treo tab thì performance.now() có thể dừng ở một số trình duyệt: quay lại tab là đồng bộ lại giờ server.
  useEffect(() => {
    if (status !== 'active' || deadline == null) return undefined;

    const resync = () => {
      if (document.visibilityState !== 'visible') return;
      const requestedAt = clockMark();
      checkActiveUserTest(testId, isGuest, guestCfg)
        .then((active) => syncServerClock(active?.serverNow, requestedAt))
        .catch(() => {});
    };

    document.addEventListener('visibilitychange', resync);
    window.addEventListener('online', resync);
    return () => {
      document.removeEventListener('visibilitychange', resync);
      window.removeEventListener('online', resync);
    };
  }, [status, deadline, testId, isGuest, guestCfg]);

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
    // Không có hạn nộp (luyện tập / đề không giới hạn giờ) thì không hiện đồng hồ.
    timeLeft: deadline == null ? null : timeLeft,
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
