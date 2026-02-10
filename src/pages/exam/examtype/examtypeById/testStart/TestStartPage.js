import axios from 'axios';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Spinner, Button, Form, Row, Col } from 'react-bootstrap';
import classNames from 'classnames/bind';
import {
  IoTimeOutline,
  IoSendOutline,
  IoInformationCircleOutline,
  IoLockClosedOutline,
  IoCheckmarkCircleOutline,
  IoVolumeHighOutline,
  IoAlertCircleOutline,
  IoChevronBackOutline
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

  const scrollToQuestion = (questionId) => {
    const element = document.getElementById(`q-${questionId}`);
    if (element) {
      const offset = 80; // Header height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const allQuestions = test.parts?.reduce((acc, part) => {
    return [...acc, ...(part.questions || [])];
  }, []) || [];

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const renderPassage = (passage, fallbackObj) => {
    // Check both objects for content and media URLs (camelCase and snake_case)
    const mUrl = passage?.mediaUrl || passage?.media_url || fallbackObj?.mediaUrl || fallbackObj?.media_url || fallbackObj?.audioUrl || fallbackObj?.audio_url || fallbackObj?.media || fallbackObj?.audio || fallbackObj?.passageMediaUrl;
    const content = passage?.content || passage?.passage_content || fallbackObj?.content || fallbackObj?.passage_content;
    const pType = passage?.passageType || passage?.passage_type || (mUrl ? 'LISTENING' : 'READING');

    if (!content && !mUrl) return null;
    return (
      <div className={cx('passage-box')}>
        {(pType === 'LISTENING' || pType === 'listening') && mUrl && (
          <div className="mb-4">
            <div className="d-flex align-items-center gap-2 mb-3 text-primary fw-bold">
              <IoVolumeHighOutline size={24} />
              <span>NGHE ĐOẠN HỘI THOẠI</span>
            </div>
            <audio controls src={getFullMediaUrl(mUrl)} className={cx('audio-player')} />
          </div>
        )}
        {content && (
          <div className={cx('passage-content')}>
            {content}
          </div>
        )}
      </div>
    );
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
      {/* --- Premium Sticky Header --- */}
      <div className={cx('header')}>
        <Container>
          <div className={cx('header-inner')}>
            <div className={cx('header-left')}>
              <button className={cx('btn-back')} onClick={() => navigate(-1)} title="Quay lại">
                <IoChevronBackOutline />
              </button>
              <div className={cx('test-info')}>
                <div className={cx('title-wrapper')}>
                  <span className={cx('title-prefix')}>Đề thi:</span>
                  <h2>{test.title}</h2>
                </div>
                <div className={cx('test-meta')}>
                  <span>{test.testType || 'Kiểm tra'}</span>
                  <span className={cx('separator')}>•</span>
                  <span>{allQuestions.length} câu hỏi</span>
                </div>
              </div>
            </div>

            <div className={cx('header-right')}>
              <div className={cx('stats-item')}>
                <div className={cx('stats-label')}>HOÀN THÀNH</div>
                <div className={cx('stats-value')}>
                  <IoCheckmarkCircleOutline className={cx('icon')} />
                  <span>{Object.keys(userAnswers).length}/{allQuestions.length}</span>
                </div>
              </div>
            </div>
          </div>
        </Container>

        {/* Dynamic Progress Bar */}
        <div className={cx('progress-container')}>
          <div
            className={cx('progress-bar')}
            style={{
              width: `${allQuestions.length > 0 ? (Object.keys(userAnswers).length / allQuestions.length) * 100 : 0}%`
            }}
          />
        </div>
      </div>

      <Container className={cx('content')}>
        <Row>
          {/* Sidebar Question Dashboard */}
          <Col lg={3}>
            <div className={cx('dashboard')}>
              <div className={cx('dashboard-card')}>
                <div className={cx('dashboard-timer')}>
                  <div className={cx('timer-label')}>THỜI GIAN CÒN LẠI</div>
                  <div className={cx('timer-value')}>
                    <IoTimeOutline className={cx('timer-icon')} />
                    <span>{formatTime(timeLeft)}</span>
                  </div>
                </div>

                <div className={cx('dashboard-header')}>
                  <IoInformationCircleOutline />
                  <span>Danh sách câu hỏi</span>
                </div>
                <div className={cx('question-grid')}>
                  {allQuestions.map((q, idx) => {
                    const isAnswered = !!userAnswers[q.questionId]?.selectedAnswerId || !!userAnswers[q.questionId]?.answerText;
                    return (
                      <button
                        key={q.questionId}
                        className={cx('q-nav-item', { answered: isAnswered })}
                        onClick={() => scrollToQuestion(q.questionId)}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
                <div className={cx('dashboard-footer')}>
                  <div className={cx('status-item')}>
                    <span className={cx('dot', 'answered')}></span>
                    <span>Đã làm</span>
                  </div>
                  <div className={cx('status-item')}>
                    <span className={cx('dot')}></span>
                    <span>Chưa làm</span>
                  </div>
                </div>
              </div>
            </div>
          </Col>

          {/* Main Question List */}
          <Col lg={9}>
            {test.parts?.map((part, i) => (
              <div key={part.testPartId} className={cx('part-section')}>
                <h3>Phần {i + 1}: {part.partName || 'Luyện tập'}</h3>

                {renderPassage(part.passage)}

                <div className={cx('questions-list')}>
                  {part.questions?.map((q, qIndex) => {
                    const absoluteIndex = allQuestions.findIndex(allQ => allQ.questionId === q.questionId) + 1;

                    return (
                      <div key={q.questionId} id={`q-${q.questionId}`} className={cx('question-card-wrapper')}>
                        {renderPassage(q.passage, q)}
                        <div className={cx('question-card')}>
                          <span className={cx('q-text')}>
                            <span className={cx('q-number')}>Câu {absoluteIndex}:</span>
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
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </Col>
        </Row>
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