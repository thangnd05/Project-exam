import axios from '../../../../../api/axiosClient';
import { checkActiveUserTest, startUserTest, submitUserTest } from '../../../../../api/userTestApi';
import { getAnswersByUserTest, batchSaveAnswers } from '../../../../../api/userAnswerApi';
import { getUserTestInfo, purchaseTestAccess } from '../../../../../api/testApi';
import { toast } from 'react-toastify';
import { useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Spinner, Button, Form, Row, Col } from 'react-bootstrap';
import classNames from 'classnames/bind';
import {
  IoSendOutline,
  IoLockClosedOutline,
  IoVolumeHighOutline,
  IoAlertCircleOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
} from 'react-icons/io5';

import { getPassageMediaByPassageId } from '~/api/passageMediaApi';
import { AuthContext } from '~/context/AuthContext';
import { useStreak } from '~/hooks/useStreak';
import { useCoins } from '~/hooks/useCoins';
import { getOrCreateGuestSessionId, guestHeaders } from '~/utils/guestSession';
import TestStartDashboard from './TestStartDashboard';
import { IoListOutline, IoCloseOutline } from 'react-icons/io5';
import styles from './TestStartPage.module.scss';

const cx = classNames.bind(styles);

const getApiErrorMessage = (error, fallbackMessage) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  fallbackMessage;

function TestStartPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
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
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  const getFullMediaUrl = (url) => {
    if (!url) return null;
    const cleanUrl = url.trim();
    if (cleanUrl.startsWith('http')) return cleanUrl;
    const backendUrl = axios.defaults.baseURL || process.env.REACT_APP_API_BASE_URL || '';
    return `${backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl}/${cleanUrl.startsWith('/') ? cleanUrl.slice(1) : cleanUrl
      }`;
  };

  const hasMediaList = (p) => {
    const list = p?.passageMedias ?? p?.passageMediaList ?? p?.passage_media;
    return Array.isArray(list) && list.length > 0;
  };

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
    const savedState = sessionStorage.getItem(`userTestState-${testId}`);
    let restored = false;

    if (savedState) {
      const parsed = JSON.parse(savedState);
      setUserTestId(parsed.userTestId || null);
      setUserAnswers(parsed.userAnswers || {});
      if (parsed.timeLeft && parsed.lastSavedAt) {
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
            const active = await checkActiveUserTest(testId, isGuest, guestCfg);
            const activeUserTestId = active?.userTestId;
            if (activeUserTestId) {
              serverStartedAt = active?.startedAt || null;
              const answers = await getAnswersByUserTest(activeUserTestId, isGuest, guestCfg);
              const answersMap = {};
              (answers || []).forEach((a) => {
                answersMap[a.questionId] = {
                  selectedAnswerId: a.selectedAnswerId || null,
                  answerText: a.answerText || null,
                };
              });
              setUserTestId(activeUserTestId);
              setUserAnswers(answersMap);
              sessionStorage.setItem(`userTest-${testId}`, activeUserTestId);
              restored = true;
            }
          } catch {
            // ignore — sẽ rơi xuống flow tạo attempt mới
          }
        }

        // Tính thời gian còn lại = min(duration − elapsedSinceStart, availableTo − now).
        const computeTimeLeft = (startedAtIso) => {
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
  }, [testId, navigate, enrichTestWithPassageMedia, isGuest, guestCfg]);

  useEffect(() => {
    if (!testId || authLoading) return;
    loadTest();
  }, [testId, authLoading, loadTest]);

  useEffect(() => {
    if (status === 'open' && test?.testId) {
      const existing = sessionStorage.getItem(`userTest-${test.testId}`);
      if (existing) {
        setUserTestId(existing);
        setStatus('active');
        return;
      }
      startUserTest(test.testId, isGuest, guestCfg)
        .then((data) => {
          const id = data.userTestId;
          const startedAtIso = data.startedAt;
          setUserTestId(id);
          sessionStorage.setItem(`userTest-${test.testId}`, id);
          // Tính lại timer dựa trên startedAt server (phòng trường hợp BE trả lại attempt sẵn có).
          if (startedAtIso) {
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
  }, [status, test, isGuest, guestCfg]);

  useEffect(() => {
    if (status === 'active' && userTestId) {
      sessionStorage.setItem(
        `userTestState-${testId}`,
        JSON.stringify({
          userTestId,
          userAnswers,
          timeLeft,
          lastSavedAt: Date.now(),
        }),
      );
    }
  }, [userAnswers, timeLeft, userTestId, status, testId]);

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
        answerText: ans.answerText || null,
      }));
      if (payload.length > 0)
        await batchSaveAnswers(payload, isGuest, guestCfg);
      const result = await submitUserTest(userTestId, isGuest, guestCfg);
      sessionStorage.removeItem(`userTest-${testId}`);
      sessionStorage.removeItem(`userTestState-${testId}`);
      if (!isGuest) refreshStreak(); // 🔥 cập nhật streak sau khi nộp bài
      navigate(`/tests/result/${userTestId}`, {
        state: { score: result.totalScore },
      });
    } catch (err) {
      if (err?.response?.status === 409) {
        sessionStorage.removeItem(`userTest-${testId}`);
        sessionStorage.removeItem(`userTestState-${testId}`);
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

  const scrollToQuestion = (questionId) => {
    const element = document.getElementById(`q-${questionId}`);
    if (element) {
      const offset = 80; // Header height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const allQuestions = useMemo(() => {
    return (
      test.parts?.reduce((acc, part) => {
        const groupedQuestions = (part.questionGroups || []).reduce((gAcc, group) => {
          return [...gAcc, ...(group.questions || [])];
        }, []);
        return [...acc, ...groupedQuestions];
      }, []) || []
    );
  }, [test.parts]);

  const questionIndexMap = useMemo(() => {
    const map = {};
    allQuestions.forEach((q, index) => {
      map[q.questionId] = index + 1;
    });
    return map;
  }, [allQuestions]);

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const hasPassageContent = (passage, fallbackObj) => {
    const content =
      passage?.content ??
      passage?.passage_content ??
      fallbackObj?.content ??
      fallbackObj?.passage_content;
    const mediaList =
      passage?.passageMediaList ??
      passage?.passageMedias ??
      passage?.mediaList ??
      passage?.passage_media ??
      [];
    if (Array.isArray(mediaList) && mediaList.length > 0) return true;
    const singleUrl =
      passage?.mediaUrl ??
      passage?.media_url ??
      fallbackObj?.mediaUrl ??
      fallbackObj?.media_url;
    return Boolean(content || singleUrl);
  };

  const renderPassage = (passage, fallbackObj) => {
    const content =
      passage?.content ??
      passage?.passage_content ??
      fallbackObj?.content ??
      fallbackObj?.passage_content;
    const translation =
      passage?.contentTranslation ??
      passage?.content_translation ??
      fallbackObj?.contentTranslation ??
      fallbackObj?.content_translation;
    const pType = passage?.passageType ?? passage?.passage_type ?? 'READING';

    // Bảng trung gian passage_media: passage có danh sách media (nhiều audio/ảnh)
    const mediaList =
      passage?.passageMediaList ??
      passage?.passageMedias ??
      passage?.mediaList ??
      passage?.passage_media ??
      [];
    const hasMediaList = Array.isArray(mediaList) && mediaList.length > 0;

    // Backward compat: một media trực tiếp trên passage (cũ)
    const singleMediaUrl =
      passage?.mediaUrl ??
      passage?.media_url ??
      fallbackObj?.mediaUrl ??
      fallbackObj?.media_url ??
      fallbackObj?.audioUrl ??
      fallbackObj?.audio_url ??
      fallbackObj?.passageMediaUrl;

    const hasContent = !!content;
    const hasAnyMedia = hasMediaList || !!singleMediaUrl;
    if (!hasContent && !hasAnyMedia) return null;

    return (
      <div className={cx('passage-box')}>
        {/* Hiển thị text content TRƯỚC ảnh/audio */}
        {content && <div className={cx('passage-content')}>{content}</div>}

        {/* Bản dịch (thu gọn mặc định) */}
        {translation && (
          <details className={cx('passage-translation')} style={{ marginTop: 8 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Bản dịch</summary>
            <div className={cx('passage-content')} style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>
              {translation}
            </div>
          </details>
        )}

        {/* Thêm đường kẻ ngang ngăn cách nếu có cả text và media */}
        {content && (hasMediaList || singleMediaUrl) && (
          <hr className={cx('passage-divider')} />
        )}

        {hasMediaList &&
          mediaList.map((m, idx) => {
            const url = m.mediaUrl ?? m.media_url;
            if (!url) return null;
            const type = (m.mediaType ?? m.media_type ?? '').toUpperCase();
            if (type === 'AUDIO') {
              return (
                <div key={idx} className="mb-3">
                  <div className="d-flex align-items-center gap-2 mb-2 text-primary fw-bold">
                    <IoVolumeHighOutline size={24} />
                    <span>
                      NGHE{' '}
                      {mediaList.filter(
                        (x) =>
                          (x.mediaType ?? x.media_type ?? '').toUpperCase() ===
                          'AUDIO',
                      ).length > 1
                        ? `(${idx + 1})`
                        : 'ĐOẠN HỘI THOẠI'}
                    </span>
                  </div>
                  <audio
                    controls
                    src={getFullMediaUrl(url)}
                    className={cx('audio-player')}
                  />
                </div>
              );
            }
            if (type === 'IMAGE') {
              return (
                <div key={idx} className="mb-3">
                  <img
                    src={getFullMediaUrl(url)}
                    alt={`Passage ${idx + 1}`}
                    className={cx('passage-image')}
                  />
                </div>
              );
            }
            return null;
          })}
        {!hasMediaList &&
          singleMediaUrl &&
          (pType === 'LISTENING' || pType === 'listening') && (
            <div className="mb-4">
              <div className="d-flex align-items-center gap-2 mb-3 text-primary fw-bold">
                <IoVolumeHighOutline size={24} />
                <span>NGHE ĐOẠN HỘI THOẠI</span>
              </div>
              <audio
                controls
                src={getFullMediaUrl(singleMediaUrl)}
                className={cx('audio-player')}
              />
            </div>
          )}
      </div>
    );
  };

  const renderQuestionOnly = (q, absoluteIndex) => {
    return (
      <div key={q.questionId} id={`q-${q.questionId}`} className={cx('question-card')}>
        <span className={cx('q-text')}>
          <span className={cx('q-number')}>Câu {absoluteIndex}:</span>
          {q.questionText}
        </span>

        {q.questionType === 'MCQ' && (
          <div className={cx('mcq-group')}>
            {q.answers?.map((a) => (
              <div
                key={a.answerId}
                className={cx('mcq-option', {
                  selected: userAnswers[q.questionId]?.selectedAnswerId === a.answerId,
                })}
                onClick={() => handleAnswerChange(q.questionId, 'MCQ', a.answerId)}
              >
                <Form.Check
                  type="radio"
                  name={`q-${q.questionId}`}
                  checked={userAnswers[q.questionId]?.selectedAnswerId === a.answerId}
                  readOnly
                />
                <span>
                  {a.answerText?.trim()
                    ? `${a.answerLabel}. ${a.answerText}`
                    : a.answerLabel}
                </span>
              </div>
            ))}
          </div>
        )}

        {q.questionType === 'FILL_BLANK' && (
          <input
            type="text"
            className={cx('fill-input')}
            value={userAnswers[q.questionId]?.answerText || ''}
            onChange={(e) => handleAnswerChange(q.questionId, 'FILL_BLANK', e.target.value)}
            placeholder="Nhập câu trả lời của bạn..."
          />
        )}

        {q.questionType === 'ESSAY' && (
          <textarea
            className={cx('essay-input')}
            value={userAnswers[q.questionId]?.answerText || ''}
            onChange={(e) => handleAnswerChange(q.questionId, 'ESSAY', e.target.value)}
            placeholder="Viết câu trả lời chi tiết tại đây..."
          />
        )}
      </div>
    );
  };

  const renderQuestionCard = (q, absoluteIndex) => {
    const hasPassage = hasPassageContent(q.passage, q);
    const questionCard = renderQuestionOnly(q, absoluteIndex);

    return (
      <div
        key={q.questionId}
        id={`q-${q.questionId}`}
        className={cx('question-card-wrapper', {
          'split-layout': hasPassage,
        })}
      >
        {hasPassage ? (
          <>
            <div className={cx('passage-column')} aria-label="Đọc tài liệu">
              {renderPassage(q.passage, q)}
            </div>
            <div className={cx('question-column')}>{questionCard}</div>
          </>
        ) : (
          <>
            {renderPassage(q.passage, q)}
            {questionCard}
          </>
        )}
      </div>
    );
  };

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

  if (status === 'loading')
    return (
      <div className={cx('state-box')}>
        <Spinner animation="grow" variant="primary" />
        <h3>Đang niêm phong đề thi...</h3>
      </div>
    );

  if (status === 'payment') {
    const cost = test.costCoins || 0;
    const enough = balance >= cost;
    return (
      <div className={cx('state-box')}>
        <IoLockClosedOutline size={80} color="#f08c00" />
        <h3>Bài kiểm tra trả phí</h3>
        <p>
           Đầu tư một lần, sử dụng mãi mãi.
        </p>
        <div className={cx('state-actions')}>
          <button
            type="button"
            className={cx('state-btn', 'state-btn-secondary')}
            onClick={() => navigate(-1)}
          >
            Quay lại
          </button>
          <button
            type="button"
            className={cx('state-btn', 'state-btn-primary')}
            disabled={purchasing || !enough}
            onClick={handlePurchase}
          >
            {purchasing ? 'Đang mở khoá...' : enough ? `Mở khoá (${cost} xu)` : 'Không đủ xu'}
          </button>
        </div>
      </div>
    );
  }

  if (status === 'no-attempts')
    return (
      <div className={cx('state-box')}>
        <IoAlertCircleOutline size={80} color="#ef4444" />
        <h3>Hết lượt làm bài</h3>
        <p>Bạn đã hoàn thành số lượt làm bài cho phép cho bài thi này.</p>
        <Button
          variant="primary"
          className="mt-4 rounded-pill"
          onClick={() => navigate(-1)}
        >
          Quay lại
        </Button>
      </div>
    );

  if (status === 'locked')
    return (
      <div className={cx('state-box')}>
        <IoLockClosedOutline size={80} color="#64748b" />
        <h3>Phòng thi chưa mở</h3>
        <p>Vui lòng đợi trong giây lát...</p>
        <div className={cx('timer-box', 'mt-4')}>
          <span className={cx('time')}>{formatTime(preCountdown)}</span>
        </div>
      </div>
    );

  if (status === 'closed')
    return (
      <div className={cx('state-box')}>
        <IoAlertCircleOutline size={80} color="#ef4444" />
        <h3>Phòng thi đã đóng</h3>
        <p>Rất tiếc, thời gian tham gia bài thi này đã kết thúc.</p>
        <Button
          variant="secondary"
          className="mt-4 rounded-pill"
          onClick={() => navigate(-1)}
        >
          Quay lại
        </Button>
      </div>
    );

  return (
    <div className={cx('wrapper')}>
      <Container fluid className={cx('content')}>
        <h1>Bài thi</h1>

        <Row>
          <Col xs={12}>
            {test.parts?.map((part, i) => (
              <div key={part.testPartId} className={cx('part-section')}>
                <h3>
                  Phần {i + 1}: {part.partName || 'Luyện tập'}
                </h3>

                <div className={cx('questions-list')}>
                  {/* Render question groups */}
                  {part.questionGroups?.map((group, groupIdx) => {
                    const hasPassage = hasPassageContent(group.passage);
                    return (
                      <div
                        key={group.passage?.passageId || groupIdx}
                        className={cx('group-section', { 'split-layout': hasPassage })}
                      >
                        {hasPassage ? (
                          <>
                            <div className={cx('passage-column')} aria-label="Đọc tài liệu">
                              {renderPassage(group.passage)}
                            </div>
                            <div className={cx('question-column')}>
                              <div className={cx('questions-frame')}>
                                {group.questions?.map((q) => {
                                  return renderQuestionOnly(q, questionIndexMap[q.questionId]);
                                })}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            {renderPassage(group.passage)}
                            {group.questions?.map((q) => {
                              return renderQuestionCard(q, questionIndexMap[q.questionId]);
                            })}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </Col>
        </Row>
      </Container>

      {/* --- Footer: nút xem thời gian & câu hỏi + Nộp bài --- */}
      <div className={cx('footer-actions')}>
        {showInfoPanel && (
          <div className={cx('footer-panel')}>
            <TestStartDashboard
              timeLeft={timeLeft}
              formatTime={formatTime}
              allQuestions={allQuestions}
              userAnswers={userAnswers}
              onScrollToQuestion={(id) => {
                scrollToQuestion(id);
                setShowInfoPanel(false);
              }}
            />
          </div>
        )}
        <div className={cx('footer-buttons')}>
          <Container className={cx('footer-buttons-inner')}>
            <button
              type="button"
              className={cx('btn-toggle-info', { active: showInfoPanel })}
              onClick={() => setShowInfoPanel((v) => !v)}
              aria-expanded={showInfoPanel}
              aria-label={
                showInfoPanel
                  ? 'Ẩn thời gian và danh sách câu'
                  : 'Xem thời gian và danh sách câu'
              }
            >
              {showInfoPanel ? (
                <IoCloseOutline size={22} />
              ) : (
                <IoListOutline size={22} />
              )}
              <span>{showInfoPanel ? 'Ẩn' : 'Thời gian & Câu hỏi'}</span>
            </button>
            <div className={cx('footer-right-group')}>
              <div className={cx('footer-pills')}>
                {timeLeft !== null && (
                  <div className={cx('exam-stat', 'exam-stat-time')}>
                    <IoTimeOutline aria-hidden />
                    <span className={cx('exam-stat-value')}>{formatTime(timeLeft)}</span>
                  </div>
                )}
                <div className={cx('exam-stat', 'exam-stat-done')}>
                  <IoCheckmarkCircleOutline aria-hidden />
                  <span className={cx('exam-stat-value')}>
                    {Object.keys(userAnswers).length}/{allQuestions.length}
                  </span>
                </div>
              </div>
              <button
                className={cx('btn-submit')}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <IoSendOutline />
                )}
                {isSubmitting ? 'Đang nộp bài...' : 'Nộp bài thi'}
              </button>
            </div>
          </Container>
        </div>
      </div>
    </div>
  );
}

export default TestStartPage;