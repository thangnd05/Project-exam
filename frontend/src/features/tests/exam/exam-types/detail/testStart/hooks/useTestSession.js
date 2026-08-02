import { useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { checkActiveUserTest, startUserTest, submitUserTest } from '~/shared/api/userTestApi';
import { getAnswersByUserTest, batchSaveAnswers } from '~/shared/api/userAnswerApi';
import { getUserTestInfo, purchaseTestAccess } from '~/shared/api/testApi';
import { getPassageMediaByPassageId } from '~/shared/api/passageMediaApi';
import { getExamTypeLayout } from '~/shared/api/examTypeApi';
import { resolveLayoutConfig } from '~/features/tests/exam/exam-types/detail/testStart/examLayout/resolveLayoutConfig';
import { defaultLayoutConfig } from '~/features/tests/exam/exam-types/detail/testStart/examLayout/layoutSchema';
import { getApiErrorMessage } from '~/shared/utils/apiError';
import { AuthContext } from '~/shared/context/AuthContext';
import { useStreak } from '~/shared/hooks/useStreak';
import { useCoins } from '~/shared/hooks/useCoins';
import { getOrCreateGuestSessionId, guestHeaders } from '~/shared/utils/guestSession';

const hasMediaList = (p) => {
  const list = p?.passageMedias ?? p?.passageMediaList ?? p?.passage_media;
  return Array.isArray(list) && list.length > 0;
};

const passageHasAudio = (passage) => {
  const list =
    passage?.passageMedias ?? passage?.passageMediaList ?? passage?.passage_media ?? [];
  if (Array.isArray(list)) {
    const found = list.some(
      (m) => (m?.mediaType ?? m?.media_type ?? '').toUpperCase() === 'AUDIO' && (m?.mediaUrl ?? m?.media_url),
    );
    if (found) return true;
  }
  const single = passage?.mediaUrl ?? passage?.media_url;
  const pType = (passage?.passageType ?? passage?.passage_type ?? '').toUpperCase();
  return Boolean(single) && pType === 'LISTENING';
};

const isListeningStep = (step) =>
  !!step && (step.audioGated === true || step.sectionType === 'LISTENING');

export function useTestSession() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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

  const { isAuthenticated, loading: authLoading } = useContext(AuthContext);
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

  const [userTestId, setUserTestId] = useState(null);
  const [test, setTest] = useState({ parts: [] });
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const [preCountdown, setPreCountdown] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [status, setStatus] = useState('loading');

  const [layoutConfig, setLayoutConfig] = useState(defaultLayoutConfig);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [maxStepIndex, setMaxStepIndex] = useState(0);

  const enrichTestWithPassageMedia = useCallback(async (testData) => {
    const parts = testData.parts || [];
    const passageIdsToFetch = new Set();
    parts.forEach((part) => {
      (part.questionGroups || []).forEach((group) => {
        const gpid = group.passage?.passageId ?? group.passage?.passage_id;
        if (gpid && !hasMediaList(group.passage)) passageIdsToFetch.add(gpid);
        (group.questions || []).forEach((q) => {
          const qpid = q.passage?.passageId ?? q.passage?.passage_id ?? q.passageId;
          if (qpid && !hasMediaList(q.passage)) passageIdsToFetch.add(qpid);
        });
      });
    });
    if (passageIdsToFetch.size === 0) return testData;

    const ids = [...passageIdsToFetch];
    const results = await Promise.all(ids.map((id) => getPassageMediaByPassageId(id).catch(() => [])));
    const mediaMap = Object.fromEntries(ids.map((id, i) => [id, results[i]]));

    const enrichWrapper = (obj) => {
      const pid = obj?.passage?.passageId ?? obj?.passage?.passage_id ?? obj?.passageId;
      if (pid && mediaMap[pid]) {
        return {
          ...obj,
          passage: { ...(obj.passage || { passageId: pid }), passageMedias: mediaMap[pid] },
        };
      }
      return obj;
    };

    const enrichedParts = parts.map((part) => ({
      ...part,
      questionGroups: (part.questionGroups || []).map((group) => ({
        ...enrichWrapper(group),
        questions: (group.questions || []).map(enrichWrapper),
      })),
    }));
    return { ...testData, parts: enrichedParts };
  }, []);

  const loadTest = useCallback(() => {
    const savedState = sessionStorage.getItem(`userTestState-${sessionKey}`);
    let restored = false;
    let savedStartedAt = null;

    if (savedState) {
      let parsed = null;
      try {
        parsed = JSON.parse(savedState);
      } catch {

        sessionStorage.removeItem(`userTestState-${sessionKey}`);
      }
      if (parsed) {
        setUserTestId(parsed.userTestId || null);
        setUserAnswers(parsed.userAnswers || {});

        const savedStep = Number.isInteger(parsed.currentStepIndex) ? parsed.currentStepIndex : 0;
        const savedMax = Number.isInteger(parsed.maxStepIndex) ? parsed.maxStepIndex : savedStep;
        setCurrentStepIndex(savedStep);
        setMaxStepIndex(Math.max(savedStep, savedMax));

        if (typeof parsed.startedAt === 'string') savedStartedAt = parsed.startedAt;
        restored = true;
      }
    }

    getUserTestInfo(testId)
      .then(async (testInfoData) => {
        const testData = { ...testInfoData, parts: testInfoData.parts || [] };
        const enriched = await enrichTestWithPassageMedia(testData);
        setTest(enriched);

        if (testData.status === 'LOGIN_REQUIRED') {
          navigate('/login', {
            state: {
              from: { pathname: `/tests/${testId}/start` },
              flashMessage: 'Bạn cần đăng nhập để làm bài thi này!',
            },
          });
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
          setPreCountdown(Math.floor((availableFrom - now) / 1000));
          return;
        }

        let serverStartedAt = null;

        const needStartedAt = !isPractice && !savedStartedAt;
        if (!restored || needStartedAt) {
          try {
            const active = await checkActiveUserTest(testId, isGuest, guestCfg, {
              mode: isPractice ? 'practice' : undefined,
              examPartIds: isPractice ? selectedPartIds : undefined,
            });
            const activeUserTestId = active?.userTestId;
            if (activeUserTestId) {
              serverStartedAt = active?.startedAt || null;

              if (!restored) {
                const answers = await getAnswersByUserTest(activeUserTestId, isGuest, guestCfg);
                const answersMap = {};
                (answers || []).forEach((a) => {
                  answersMap[a.questionId] = {
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
  }, [testId, sessionKey, isPractice, selectedPartIds, navigate, enrichTestWithPassageMedia, isGuest, guestCfg]);

  useEffect(() => {
    if (!testId || authLoading) return;
    loadTest();
  }, [testId, authLoading, loadTest]);

  useEffect(() => {
    const examTypeId = test?.examTypeId;
    if (!examTypeId) return;
    let cancelled = false;
    getExamTypeLayout(examTypeId)
      .then((res) => {
        if (!cancelled) setLayoutConfig(resolveLayoutConfig(res));
      })
      .catch(() => {
        if (!cancelled) setLayoutConfig(defaultLayoutConfig);
      });
    return () => {
      cancelled = true;
    };
  }, [test?.examTypeId]);

  useEffect(() => {
    if (status === 'open' && test?.testId) {
      const existing = sessionStorage.getItem(`userTest-${sessionKey}`);
      if (existing) {
        setUserTestId(existing);

        try {
          const saved = JSON.parse(sessionStorage.getItem(`userTestState-${sessionKey}`) || 'null');
          if (saved?.startedAt) setStartedAt(saved.startedAt);
        } catch {

        }
        setStatus('active');
        return;
      }
      startUserTest(test.testId, isGuest, guestCfg, {
        mode: isPractice ? 'practice' : undefined,
        examPartIds: isPractice ? selectedPartIds : undefined,
      })
        .then((data) => {
          setUserTestId(data.userTestId);
          sessionStorage.setItem(`userTest-${sessionKey}`, data.userTestId);

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
          currentStepIndex,
          maxStepIndex,
          lastSavedAt: Date.now(),
        }),
      );
    }
  }, [userAnswers, startedAt, userTestId, status, sessionKey, currentStepIndex, maxStepIndex]);

  useEffect(() => {
    if (status !== 'active' || !userTestId) return;
    const entries = Object.entries(userAnswers);
    if (entries.length === 0) return;
    const handle = setTimeout(() => {
      const payload = entries.map(([qid, ans]) => ({
        userTestId,
        questionId: String(qid),
        selectedAnswerId: ans?.selectedAnswerId || null,
        selectedAnswerIds: ans?.selectedAnswerIds || null,
        answerText: ans?.answerText || null,
      }));
      batchSaveAnswers(payload, isGuest, guestCfg).catch(() => {  });
    }, 2000);
    return () => clearTimeout(handle);
  }, [userAnswers, status, userTestId, isGuest, guestCfg]);

  useEffect(() => {
    if (status === 'locked' && preCountdown !== null) {
      if (preCountdown <= 0) {
        setStatus('open');
        return;
      }
      const timer = setInterval(() => setPreCountdown((p) => p - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [preCountdown, status]);

  const handleAnswerChange = (questionId, type, value) => {

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
      const payload = Object.entries(userAnswers).map(([qid, ans]) => ({
        userTestId,
        questionId: String(qid),
        selectedAnswerId: ans.selectedAnswerId || null,
        selectedAnswerIds: ans.selectedAnswerIds || null,
        answerText: ans.answerText || null,
      }));
      if (payload.length > 0)
        await batchSaveAnswers(payload, isGuest, guestCfg);
      const result = await submitUserTest(userTestId, isGuest, guestCfg);
      sessionStorage.removeItem(`userTest-${sessionKey}`);
      sessionStorage.removeItem(`userTestState-${sessionKey}`);
      if (!isGuest) refreshStreak();
      navigate(`/tests/result/${userTestId}`, {
        state: { score: result.totalScore },
      });
    } catch (err) {
      if (err?.response?.status === 409) {
        sessionStorage.removeItem(`userTest-${sessionKey}`);
        sessionStorage.removeItem(`userTestState-${sessionKey}`);
        navigate(`/tests/result/${userTestId}`);
        return;
      }
      toast.error(getApiErrorMessage(err, 'Nộp bài thất bại! Vui lòng thử lại.'));
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleSubmitRef = useRef();
  handleSubmitRef.current = handleSubmit;

  const deadline = useMemo(() => {
    if (isPractice || !startedAt) return null;
    const durationMinutes = test?.durationMinutes;
    const durationSec = durationMinutes && durationMinutes > 0 ? durationMinutes * 60 : null;
    let end = durationSec !== null ? new Date(startedAt).getTime() + durationSec * 1000 : null;
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
        if (!submittingRef.current) handleSubmitRef.current();
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [status, deadline]);

  const visibleParts = useMemo(() => {
    const parts = test.parts || [];
    if (!isPractice || selectedPartIds.length === 0) return parts;
    const set = new Set(selectedPartIds);
    return parts.filter((p) => set.has(p.examPartId));
  }, [test.parts, isPractice, selectedPartIds]);

  const allQuestions = useMemo(() => {
    return (
      visibleParts.reduce((acc, part) => {
        const groupedQuestions = (part.questionGroups || []).reduce((gAcc, group) => {
          return [...gAcc, ...(group.questions || [])];
        }, []);
        return [...acc, ...groupedQuestions];
      }, []) || []
    );
  }, [visibleParts]);

  const questionIndexMap = useMemo(() => {
    const map = {};
    allQuestions.forEach((q, index) => {
      map[q.questionId] = index + 1;
    });
    return map;
  }, [allQuestions]);

  const isPaged = (layoutConfig?.questionArea?.navigationMode || 'scroll') === 'paged';

  const flowSteps = useMemo(() => {
    const steps = [];
    visibleParts.forEach((part) => {
      (part.questionGroups || []).forEach((group, gi) => {
        const passage = group.passage || null;
        const pType = (passage?.passageType ?? passage?.passage_type ?? '').toUpperCase();
        const sectionType =
          pType === 'LISTENING' ? 'LISTENING' : pType === 'READING' ? 'READING' : null;

        const audioGated = sectionType === 'LISTENING' && passageHasAudio(passage);
        steps.push({
          key: passage?.passageId || group.questions?.[0]?.questionId || `${part.testPartId}-${gi}`,
          partId: part.testPartId,
          partName: part.partName || '',
          sectionType,
          audioGated,
          passage,
          questions: group.questions || [],
        });
      });
    });
    return steps;
  }, [visibleParts]);

  const questionStepIndex = useMemo(() => {
    const map = {};
    flowSteps.forEach((s, i) => (s.questions || []).forEach((q) => { map[q.questionId] = i; }));
    return map;
  }, [flowSteps]);

  useEffect(() => {
    if (flowSteps.length === 0) return;
    setCurrentStepIndex((i) => Math.max(0, Math.min(i, flowSteps.length - 1)));
  }, [flowSteps.length]);

  useEffect(() => {
    setMaxStepIndex((m) => Math.max(m, currentStepIndex));
  }, [currentStepIndex]);

  const listeningGateBefore = useMemo(() => {
    const arr = new Array(flowSteps.length).fill(-1);
    let last = -1;
    for (let i = 0; i < flowSteps.length; i += 1) {
      arr[i] = last;
      if (isListeningStep(flowSteps[i])) last = i;
    }
    return arr;
  }, [flowSteps]);

  const canGoToStep = useCallback(
    (target) => {
      if (target < 0 || target >= flowSteps.length) return false;

      if (isListeningStep(flowSteps[target])) return target === currentStepIndex;

      return maxStepIndex > listeningGateBefore[target];
    },
    [flowSteps, maxStepIndex, currentStepIndex, listeningGateBefore],
  );

  const goToStep = useCallback(
    (target) => {
      const t = Math.max(0, Math.min(target, flowSteps.length - 1));
      if (!canGoToStep(t)) return;
      setCurrentStepIndex(t);
    },
    [canGoToStep, flowSteps.length],
  );

  const goNext = useCallback(() => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, flowSteps.length - 1));
  }, [flowSteps.length]);

  const goPrev = useCallback(() => {
    setCurrentStepIndex((prev) => {
      const target = prev - 1;
      if (target < 0) return prev;
      if (isListeningStep(flowSteps[target])) return prev;
      return target;
    });
  }, [flowSteps]);

  const goToQuestion = useCallback(
    (questionId) => {
      const idx = questionStepIndex[questionId];
      if (idx == null) return;
      goToStep(idx);
    },
    [questionStepIndex, goToStep],
  );

  const canNavigateToQuestion = useCallback(
    (questionId) => {
      const idx = questionStepIndex[questionId];
      if (idx == null) return false;
      return canGoToStep(idx);
    },
    [questionStepIndex, canGoToStep],
  );

  const canGoPrev =
    isPaged && currentStepIndex > 0 && !isListeningStep(flowSteps[currentStepIndex - 1]);

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
    allQuestions,
    questionIndexMap,
    handleAnswerChange,
    handleSubmit,
    handlePurchase,

    isPaged,
    flowSteps,
    currentStepIndex,
    canGoPrev,
    goNext,
    goPrev,
    goToStep,
    goToQuestion,
    canNavigateToQuestion,
  };
}
