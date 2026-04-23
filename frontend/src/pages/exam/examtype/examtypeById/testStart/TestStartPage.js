import axios from 'axios';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
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
    const backendUrl = axios.defaults.baseURL || 'http://localhost:8080';
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

  useEffect(() => {
    if (!testId) return;
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

    axios
      .get(`/api/tests/usertest/${testId}`)
      .then(async (res) => {
        const testData = { ...res.data, parts: res.data.parts || [] };
        const enriched = await enrichTestWithPassageMedia(testData);
        setTest(enriched);

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

        if (availableTo && now > availableTo) {
          setStatus('closed');
          return;
        }

        if (!restored) {
          const durationMinutes = testData.durationMinutes;
          let finalTime = null;

          if (durationMinutes && durationMinutes > 0) {
            finalTime = durationMinutes * 60;
          }

          if (availableTo) {
            const diffSeconds = Math.floor((availableTo - now) / 1000);
            const deadlineRemaining = Math.max(0, diffSeconds);
            if (finalTime === null || deadlineRemaining < finalTime) {
              finalTime = deadlineRemaining;
            }
          }
          setTimeLeft(finalTime);
          setStatus('open');
        } else {
          setStatus('active');
        }
      })
      .catch(() => setStatus('error'));
  }, [testId, navigate, enrichTestWithPassageMedia]);

  useEffect(() => {
    if (status === 'open' && test?.testId) {
      const existing = sessionStorage.getItem(`userTest-${test.testId}`);
      if (existing) {
        setUserTestId(existing);
        setStatus('active');
        return;
      }
      axios
        .post('/api/user-tests', { testId: test.testId })
        .then((res) => {
          const id = res.data.userTestId;
          setUserTestId(id);
          sessionStorage.setItem(`userTest-${test.testId}`, id);
          setStatus('active');
        })
        .catch((err) => {
          if (err.response?.status === 403) setStatus('no-attempts');
          else setStatus('error');
        });
    }
  }, [status, test]);

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
        await axios.post('/api/user-answers/batch', payload);
      const res = await axios.post(`/api/user-tests/${userTestId}/submit`);
      sessionStorage.removeItem(`userTest-${testId}`);
      sessionStorage.removeItem(`userTestState-${testId}`);
      navigate(`/tests/result/${userTestId}`, {
        state: { score: res.data.totalScore },
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

  const hasPassageImage = (passage, fallbackObj) => {
    const mediaList =
      passage?.passageMediaList ??
      passage?.passageMedias ??
      passage?.mediaList ??
      passage?.passage_media ??
      [];
    if (
      Array.isArray(mediaList) &&
      mediaList.some(
        (m) => (m.mediaType ?? m.media_type ?? '').toUpperCase() === 'IMAGE',
      )
    )
      return true;
    const singleUrl =
      passage?.mediaUrl ??
      passage?.media_url ??
      fallbackObj?.mediaUrl ??
      fallbackObj?.media_url;
    const pType =
      passage?.passageType ?? passage?.passage_type ?? fallbackObj?.passageType;
    return !!(singleUrl && (pType === 'READING' || pType === 'reading'));
  };

  const renderPassage = (passage, fallbackObj) => {
    const content =
      passage?.content ??
      passage?.passage_content ??
      fallbackObj?.content ??
      fallbackObj?.passage_content;
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
        {content && <div className={cx('passage-content')}>{content}</div>}
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
                  {a.answerLabel}. {a.answerText}
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
    const passageHasImage = hasPassageImage(q.passage, q);
    const questionCard = renderQuestionOnly(q, absoluteIndex);

    return (
      <div
        key={q.questionId}
        id={`q-${q.questionId}`}
        className={cx('question-card-wrapper', {
          'split-layout': passageHasImage,
        })}
      >
        {passageHasImage ? (
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

  if (status === 'loading')
    return (
      <div className={cx('state-box')}>
        <Spinner animation="grow" variant="primary" />
        <h3>Đang niêm phong đề thi...</h3>
      </div>
    );

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
                    const passageHasImage = hasPassageImage(group.passage);
                    return (
                      <div
                        key={group.passage?.passageId || groupIdx}
                        className={cx('group-section', { 'split-layout': passageHasImage })}
                      >
                        {passageHasImage ? (
                          <>
                            <div className={cx('passage-column')} aria-label="Đọc tài liệu">
                              {renderPassage(group.passage)}
                            </div>
                            <div className={cx('question-column')}>
                              {group.questions?.map((q) => {
                                return renderQuestionOnly(q, questionIndexMap[q.questionId]);
                              })}
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