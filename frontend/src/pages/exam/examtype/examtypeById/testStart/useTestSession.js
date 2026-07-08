import { useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { checkActiveUserTest, startUserTest, submitUserTest } from '~/api/userTestApi';
import { getAnswersByUserTest, batchSaveAnswers } from '~/api/userAnswerApi';
import { getUserTestInfo, purchaseTestAccess } from '~/api/testApi';
import { getPassageMediaByPassageId } from '~/api/passageMediaApi';
import { getExamTypeLayout } from '~/api/examTypeApi';
import { resolveLayoutConfig } from './examLayout/resolveLayoutConfig';
import { defaultLayoutConfig } from './examLayout/layoutSchema';
import { getApiErrorMessage } from '~/utils/apiError';
import { AuthContext } from '~/context/AuthContext';
import { useStreak } from '~/hooks/useStreak';
import { useCoins } from '~/hooks/useCoins';
import { getOrCreateGuestSessionId, guestHeaders } from '~/utils/guestSession';

const hasMediaList = (p) => {
  const list = p?.passageMedias ?? p?.passageMediaList ?? p?.passage_media;
  return Array.isArray(list) && list.length > 0;
};

export function useTestSession() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Chế độ làm bài đọc từ query param (?mode=practice&parts=id1,id2) để sống sót qua reload.
  const isPractice = searchParams.get('mode') === 'practice';
  const partsParam = searchParams.get('parts') || '';
  const selectedPartIds = useMemo(
    () => (partsParam ? partsParam.split(',').filter(Boolean) : []),
    [partsParam],
  );
  // Khóa sessionStorage riêng cho mỗi (đề, mode, bộ Part) để phiên full-test và
  // các phiên luyện tập theo Part khác nhau không đè lên nhau.
  const sessionKey = useMemo(() => {
    if (!isPractice) return testId;
    return `${testId}::practice::${[...selectedPartIds].sort().join(',')}`;
  }, [testId, isPractice, selectedPartIds]);

  const { isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const { refreshStreak } = useStreak();
  const { balance, refreshCoins } = useCoins();
  const [purchasing, setPurchasing] = useState(false);

  // Guest session: chỉ khởi tạo khi đã xác định KHÔNG đăng nhập.
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
  const [preCountdown, setPreCountdown] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState('loading');
  // Bố cục giao diện làm bài theo examType (fallback về mặc định khi chưa cấu hình).
  const [layoutConfig, setLayoutConfig] = useState(defaultLayoutConfig);

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

    if (savedState) {
      const parsed = JSON.parse(savedState);
      setUserTestId(parsed.userTestId || null);
      setUserAnswers(parsed.userAnswers || {});
      // Luyện tập theo Part: KHÔNG giới hạn giờ -> timeLeft luôn null.
      if (isPractice) {
        setTimeLeft(null);
      } else if (parsed.timeLeft && parsed.lastSavedAt) {
        const elapsed = Math.floor((Date.now() - parsed.lastSavedAt) / 1000);
        setTimeLeft(Math.max(0, parsed.timeLeft - elapsed));
      } else {
        setTimeLeft(parsed.timeLeft || null);
      }
      restored = true;
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

        // 🔄 Nếu không có state trong sessionStorage (vd. vừa logout/login),
        // thử khôi phục từ server: tìm attempt đang IN_PROGRESS + answers đã lưu.
        let serverStartedAt = null;
        if (!restored) {
          try {
            const active = await checkActiveUserTest(testId, isGuest, guestCfg, {
              mode: isPractice ? 'practice' : undefined,
              examPartIds: isPractice ? selectedPartIds : undefined,
            });
            const activeUserTestId = active?.userTestId;
            if (activeUserTestId) {
              serverStartedAt = active?.startedAt || null;
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
              sessionStorage.setItem(`userTest-${sessionKey}`, activeUserTestId);
              restored = true;
            }
          } catch {
            // ignore — sẽ rơi xuống flow tạo attempt mới
          }
        }

        // Tính thời gian còn lại = min(duration − elapsedSinceStart, availableTo − now).
        // Chế độ luyện tập theo Part: không giới hạn giờ -> luôn null.
        const computeTimeLeft = (startedAtIso) => {
          if (isPractice) return null;
          const durationMinutes = testData.durationMinutes;
          const durationSec = durationMinutes && durationMinutes > 0 ? durationMinutes * 60 : null;
          let elapsedSec = 0;
          if (startedAtIso) {
            const startedMs = new Date(startedAtIso).getTime();
            elapsedSec = Math.max(0, Math.floor((Date.now() - startedMs) / 1000));
          }
          let remaining = durationSec !== null ? Math.max(0, durationSec - elapsedSec) : null;
          if (availableTo) {
            const deadlineRemaining = Math.max(0, Math.floor((availableTo - now) / 1000));
            if (remaining === null || deadlineRemaining < remaining) remaining = deadlineRemaining;
          }
          return remaining;
        };

        if (availableTo && now > availableTo && !restored) {
          // chỉ chặn vào mới khi đã hết giờ; resume thì vẫn cho làm tiếp.
          setStatus('closed');
          return;
        }

        if (!restored) {
          // Tạo attempt mới: timer = full duration (sẽ đè lại sau khi POST /api/user-tests trả startedAt).
          setTimeLeft(computeTimeLeft(null));
          setStatus('open');
        } else {
          // Resume: ưu tiên timeLeft từ sessionStorage (đã trừ elapsed lần trước),
          // nếu không có (logout xoá storage) thì tính từ startedAt server-side.
          setStatus('active');
          setTimeLeft((prev) => {
            if (prev !== null && prev !== undefined) return prev;
            return computeTimeLeft(serverStartedAt);
          });
        }
      })
      .catch(() => setStatus('error'));
  }, [testId, sessionKey, isPractice, selectedPartIds, navigate, enrichTestWithPassageMedia, isGuest, guestCfg]);

  useEffect(() => {
    if (!testId || authLoading) return;
    loadTest();
  }, [testId, authLoading, loadTest]);

  // Lấy layout của examType (đã fallback lá->cha ở backend). Lỗi/không có -> giữ mặc định.
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
        setStatus('active');
        return;
      }
      startUserTest(test.testId, isGuest, guestCfg, {
        mode: isPractice ? 'practice' : undefined,
        examPartIds: isPractice ? selectedPartIds : undefined,
      })
        .then((data) => {
          const id = data.userTestId;
          const startedAtIso = data.startedAt;
          setUserTestId(id);
          sessionStorage.setItem(`userTest-${sessionKey}`, id);
          // Luyện tập: không giới hạn giờ. Full-test: tính lại timer theo startedAt server.
          if (isPractice) {
            setTimeLeft(null);
          } else if (startedAtIso) {
            const now = new Date();
            const availableTo = test.availableTo ? new Date(test.availableTo) : null;
            const durationMinutes = test.durationMinutes;
            const durationSec = durationMinutes && durationMinutes > 0 ? durationMinutes * 60 : null;
            const elapsedSec = Math.max(0, Math.floor((Date.now() - new Date(startedAtIso).getTime()) / 1000));
            let remaining = durationSec !== null ? Math.max(0, durationSec - elapsedSec) : null;
            if (availableTo) {
              const deadlineRemaining = Math.max(0, Math.floor((availableTo - now) / 1000));
              if (remaining === null || deadlineRemaining < remaining) remaining = deadlineRemaining;
            }
            setTimeLeft(remaining);
          }
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
          timeLeft,
          lastSavedAt: Date.now(),
        }),
      );
    }
  }, [userAnswers, timeLeft, userTestId, status, sessionKey]);

  // 🔄 Autosave answers lên server (debounced 2s) — để logout/đóng tab vẫn khôi phục được.
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
      batchSaveAnswers(payload, isGuest, guestCfg).catch(() => { /* swallow */ });
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
    if (type === 'MSQ') {
      // value = answerId vừa bấm → toggle trong danh sách đã chọn.
      const current = userAnswers[questionId]?.selectedAnswerIds || [];
      const next = current.includes(value)
        ? current.filter((x) => x !== value)
        : [...current, value];
      setUserAnswers({ ...userAnswers, [questionId]: { selectedAnswerIds: next } });
      return;
    }
    const updatedAnswer =
      type === 'MCQ' ? { selectedAnswerId: value } : { answerText: value };
    setUserAnswers({ ...userAnswers, [questionId]: updatedAnswer });
  };

  const handleSubmit = async () => {
    if (!userTestId || isSubmitting) return;
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
      if (!isGuest) refreshStreak(); // 🔥 cập nhật streak sau khi nộp bài
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
      alert(getApiErrorMessage(err, 'Nộp bài thất bại! Vui lòng thử lại.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitRef = useRef();
  handleSubmitRef.current = handleSubmit;

  useEffect(() => {
    if (status !== 'active' || timeLeft == null) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev == null) return prev;
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status, timeLeft]);

  // Luyện tập theo Part: chỉ hiển thị + chấm các Part đã chọn. Full-test: hiện tất cả.
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
  };
}
