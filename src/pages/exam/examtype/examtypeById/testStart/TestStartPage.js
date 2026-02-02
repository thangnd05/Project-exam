import axios from 'axios';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Spinner, Button, Form } from 'react-bootstrap';
import classNames from 'classnames/bind';
import {
  IoTimeOutline,
  IoSendOutline,
  IoInformationCircleOutline,
  IoLockClosedOutline,
  IoCheckmarkCircleOutline,
  IoVolumeHighOutline,
  IoAlertCircleOutline
} from 'react-icons/io5';

import styles from './TestStartPage.module.scss';

const cx = classNames.bind(styles);

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

  const getFullMediaUrl = (url) => {
    if (!url) return null;
    const cleanUrl = url.trim();
    if (cleanUrl.startsWith('http')) return cleanUrl;
    const backendUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
    return `${backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl}/${cleanUrl.startsWith('/') ? cleanUrl.slice(1) : cleanUrl}`;
  };

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

    axios.get(`/api/tests/usertest/${testId}`)
      .then((res) => {
        const testData = { ...res.data, parts: res.data.parts || [] };
        setTest(testData);

        if (testData.canDoTest === false) {
          setStatus('no-attempts');
          return;
        }

        const now = new Date();
        const availableFrom = testData.availableFrom ? new Date(testData.availableFrom) : null;
        const availableTo = testData.availableTo ? new Date(testData.availableTo) : null;

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
          const durationSeconds = (testData.durationMinutes || 0) * 60;
          let finalTime = durationSeconds;
          if (availableTo) {
            const diffSeconds = Math.floor((availableTo - now) / 1000);
            if (diffSeconds > 0) finalTime = Math.min(durationSeconds, diffSeconds);
            else finalTime = 0;
          }
          setTimeLeft(finalTime);
          setStatus('open');
        } else {
          setStatus('active');
        }
      })
      .catch(() => setStatus('error'));
  }, [testId, navigate]);

  useEffect(() => {
    if (status === 'open' && test?.testId) {
      const existing = sessionStorage.getItem(`userTest-${test.testId}`);
      if (existing) {
        setUserTestId(existing);
        setStatus('active');
        return;
      }
      axios.post('/api/user-tests', { testId: test.testId })
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
      sessionStorage.setItem(`userTestState-${testId}`, JSON.stringify({
        userTestId, userAnswers, timeLeft, lastSavedAt: Date.now()
      }));
    }
  }, [userAnswers, timeLeft, userTestId, status, testId]);

  useEffect(() => {
    if (status === 'locked' && preCountdown !== null) {
      if (preCountdown <= 0) { setStatus('open'); return; }
      const timer = setInterval(() => setPreCountdown(p => p - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [preCountdown, status]);

  useEffect(() => {
    if (status === 'active' && timeLeft !== null) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status, timeLeft]);

  const handleAnswerChange = (questionId, type, value) => {
    const updatedAnswer = type === 'MCQ' ? { selectedAnswerId: value } : { answerText: value };
    setUserAnswers({ ...userAnswers, [questionId]: updatedAnswer });
  };

  const handleSubmit = async () => {
    if (!userTestId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = Object.entries(userAnswers).map(([qid, ans]) => ({
        userTestId, questionId: parseInt(qid),
        selectedAnswerId: ans.selectedAnswerId || null,
        answerText: ans.answerText || null
      }));
      if (payload.length > 0) await axios.post('/api/user-answers/batch', payload);
      const res = await axios.post(`/api/user-tests/${userTestId}/submit`);
      sessionStorage.removeItem(`userTest-${testId}`);
      sessionStorage.removeItem(`userTestState-${testId}`);
      navigate(`/tests/result/${userTestId}`, { state: { score: res.data.totalScore } });
    } catch (err) {
      alert('Nộp bài thất bại! Vui lòng thử lại.');
    } finally { setIsSubmitting(false); }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (status === 'loading') return (
    <div className={cx('state-box')}>
      <Spinner animation="grow" variant="primary" />
      <h3>Đang niêm phong đề thi...</h3>
    </div>
  );

  if (status === 'no-attempts') return (
    <div className={cx('state-box')}>
      <IoAlertCircleOutline size={80} color="#ef4444" />
      <h3>Hết lượt làm bài</h3>
      <p>Bạn đã hoàn thành số lượt làm bài cho phép cho bài thi này.</p>
      <Button variant="primary" className="mt-4 rounded-pill" onClick={() => navigate(-1)}>Quay lại</Button>
    </div>
  );

  if (status === 'locked') return (
    <div className={cx('state-box')}>
      <IoLockClosedOutline size={80} color="#64748b" />
      <h3>Phòng thi chưa mở</h3>
      <p>Vui lòng đợi trong giây lát...</p>
      <div className={cx('timer-box', 'mt-4')}>
        <span className={cx('time')}>{formatTime(preCountdown)}</span>
      </div>
    </div>
  );

  if (status === 'closed') return (
    <div className={cx('state-box')}>
      <IoAlertCircleOutline size={80} color="#ef4444" />
      <h3>Phòng thi đã đóng</h3>
      <p>Rất tiếc, thời gian tham gia bài thi này đã kết thúc.</p>
      <Button variant="secondary" className="mt-4 rounded-pill" onClick={() => navigate(-1)}>Quay lại</Button>
    </div>
  );

  return (
    <div className={cx('wrapper')}>
      {/* --- Sticky Header --- */}
      <div className={cx('header')}>
        <Container>
          <div className={cx('header-inner')}>
            <div className={cx('test-info')}>
              <h2>{test.title}</h2>
            </div>
            <div className={cx('timer-box')}>
              <IoTimeOutline className={cx('timer-icon')} />
              <span className={cx('time')}>{formatTime(timeLeft)}</span>
            </div>
          </div>
        </Container>
      </div>

      <Container className={cx('content')}>
        {test.parts?.map((part, i) => (
          <div key={part.testPartId} className={cx('part-section')}>
            <h3>Phần {i + 1}: {part.partName || 'Luyện tập'}</h3>

            {(part.passage?.content || part.passage?.mediaUrl) && (
              <div className={cx('passage-box')}>
                {part.passage.passageType === 'LISTENING' && part.passage.mediaUrl && (
                  <div className="mb-4">
                    <div className="d-flex align-items-center gap-2 mb-2 text-primary fw-bold">
                      <IoVolumeHighOutline size={24} />
                      <span>Nghe đoạn hội thoại</span>
                    </div>
                    <audio controls src={getFullMediaUrl(part.passage.mediaUrl)} className={cx('audio-player')} />
                  </div>
                )}
                {part.passage.content && <div className={cx('passage-content')}>{part.passage.content}</div>}
              </div>
            )}

            {part.questions?.map((q, qIndex) => (
              <div key={q.questionId} className={cx('question-card')}>
                <span className={cx('q-text')}>
                  <span className={cx('q-number')}>Câu {qIndex + 1}:</span>
                  {q.questionText}
                </span>

                {q.questionType === 'MCQ' && (
                  <div className={cx('mcq-group')}>
                    {q.answers?.map((a) => (
                      <div
                        key={a.answerId}
                        className={cx('mcq-option', { selected: userAnswers[q.questionId]?.selectedAnswerId === a.answerId })}
                        onClick={() => handleAnswerChange(q.questionId, 'MCQ', a.answerId)}
                      >
                        <Form.Check
                          type="radio"
                          name={`q-${q.questionId}`}
                          checked={userAnswers[q.questionId]?.selectedAnswerId === a.answerId}
                          readOnly
                        />
                        <span>{a.answerLabel}. {a.answerText}</span>
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
            ))}
          </div>
        ))}
      </Container>

      {/* --- Fixed Footer Action --- */}
      <div className={cx('footer-actions')}>
        <Container>
          <button
            className={cx('btn-submit')}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Spinner animation="border" size="sm" /> : <IoSendOutline />}
            {isSubmitting ? 'Đang nộp bài...' : 'Nộp bài thi'}
          </button>
        </Container>
      </div>
    </div>
  );
}

export default TestStartPage;
