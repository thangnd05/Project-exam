import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Spinner, Alert } from 'react-bootstrap';
import classNames from 'classnames/bind';
import {
  IoCheckmarkCircle,
  IoHomeOutline,
  IoStatsChartOutline,
  IoTimeOutline,
  IoSchoolOutline,
  IoChevronForwardOutline
} from 'react-icons/io5';

import styles from './TestResultPage.module.scss';

const cx = classNames.bind(styles);

const TestResultPage = () => {
  const { userTestId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [test, setTest] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await axios.get(`/api/user-tests/${userTestId}/result`);
        setResult(res.data);
      } catch (err) {
        console.error('❌ Lỗi tải kết quả:', err);
        setError('Không thể tải kết quả bài thi này 😢');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [userTestId]);

  const handleShowDetail = async () => {
    if (showDetail) {
      setShowDetail(false);
      return;
    }

    if (test) {
      setShowDetail(true);
      return;
    }

    setDetailLoading(true);
    try {
      const metaRes = await axios.get(`/api/user-tests/${userTestId}`);
      const testId = metaRes.data.testId;

      const [testRes, answersRes] = await Promise.all([
        axios.get(`/api/tests/admintest/${testId}`),
        axios.get(`/api/user-answers/user-test/${userTestId}`),
      ]);

      setTest(testRes.data);
      setUserAnswers(answersRes.data);
      setShowDetail(true);
    } catch (err) {
      console.error('❌ Lỗi tải chi tiết bài thi:', err);
      alert('Không thể tải chi tiết câu hỏi. Vui lòng thử lại sau.');
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) return (
    <div className={cx('wrapper')}>
      <Container className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 fw-bold text-primary">Đang tổng hợp điểm số của bạn...</p>
      </Container>
    </div>
  );

  if (error) return (
    <div className={cx('wrapper')}>
      <Container>
        <Alert variant="danger" className="rounded-xl shadow-sm">{error}</Alert>
        <button className="btn btn-primary rounded-pill mt-3" onClick={() => navigate('/')}>Quay lại trang chủ</button>
      </Container>
    </div>
  );

  return (
    <div className={cx('wrapper')}>
      <Container>
        <div className={cx('result-card')}>
          <div className={cx('icon-success')}>
            <IoCheckmarkCircle />
          </div>

          <h1>Chúc mừng bạn đã hoàn thành!</h1>
          <p className={cx('subtitle')}>
            Hệ thống đã ghi nhận nỗ lực của bạn trong bài thi <strong>"{result?.testTitle || 'Luyện tập'}"</strong>
          </p>

          <div className={cx('score-display')}>
            <span className={cx('label')}>Điểm số đạt được</span>
            <div className={cx('points')}>
              {result?.totalScore?.toFixed(2) || location.state?.score?.toFixed(2) || '0.00'}
              <span className={cx('unit')}>điểm</span>
            </div>
          </div>

          <div className={cx('stats-grid')}>
            <div className={cx('stat-item', 'correct')}>
              <IoCheckmarkCircle size={24} />
              <span className={cx('stat-val')}>{result?.correct || 0}</span>
              <span className={cx('stat-label')}>Câu đúng</span>
            </div>
            <div className={cx('stat-item', 'wrong')}>
              <IoStatsChartOutline size={24} />
              <span className={cx('stat-val')}>{result?.wrong || 0}</span>
              <span className={cx('stat-label')}>Câu sai</span>
            </div>
            <div className={cx('stat-item', 'total')}>
              <IoSchoolOutline size={24} />
              <span className={cx('stat-val')}>{result?.total || 0}</span>
              <span className={cx('stat-label')}>Tổng số câu</span>
            </div>
            <div className={cx('stat-item')}>
              <IoTimeOutline size={24} color="#6366f1" />
              <span className={cx('stat-val')}>--</span>
              <span className={cx('stat-label')}>Thời gian làm</span>
            </div>
          </div>

          <div className={cx('actions')}>
            <button
              className={cx('btn-detail')}
              onClick={handleShowDetail}
              disabled={detailLoading}
            >
              {detailLoading ? <Spinner animation="border" size="sm" /> : <IoStatsChartOutline size={20} />}
              {showDetail ? 'Ẩn chi tiết bài làm' : 'Xem giải thích & Đáp án'}
            </button>

            <button className={cx('btn-home')} onClick={() => navigate('/')}>
              <IoHomeOutline size={20} />
              Về trang chủ
              <IoChevronForwardOutline />
            </button>

            <button className={cx('btn-review')} onClick={() => navigate('/my-test')}>
              <IoSchoolOutline size={20} />
              Xem lịch sử bài thi khác
            </button>
          </div>
        </div>

        {/* CHI TIẾT BÀI LÀM */}
        {showDetail && test && (
          <div className={cx('detail-section')}>
            <h2 className={cx('section-title')}>Chi tiết bài làm</h2>
            {test.parts?.map((part, i) => (
              <div key={part.testPartId} className={cx('test-part')}>
                <h3 className={cx('part-title')}>Phần {i + 1}</h3>
                {part.passage && (
                  <div className={cx('passage')}>
                    <h4>
                      {part.passage.passageType === 'LISTENING' ? '🎵 Bài nghe:' : '📖 Đoạn văn:'}
                    </h4>
                    {part.passage.passageType === 'LISTENING' && part.passage.mediaUrl && (
                      <audio controls src={part.passage.mediaUrl} className={cx('audio-player')} />
                    )}
                    {part.passage.content && (
                      <div className={cx('passage-content')}>{part.passage.content}</div>
                    )}
                  </div>
                )}

                <div className={cx('questions-list')}>
                  {part.questions?.map((q) => {
                    const userAnswer = userAnswers.find(ua => ua.questionId === q.questionId);
                    return <QuestionResult key={q.questionId} question={q} userAnswer={userAnswer} />;
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
};

// COMPONENT HIỂN THỊ TỪNG CÂU HỎI
function QuestionResult({ question, userAnswer }) {
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const correctAnswer = question.answers?.find((a) => a.isCorrect);

  let isUserCorrect = false;
  if (question.questionType === 'MCQ' && userAnswer && correctAnswer) {
    isUserCorrect = userAnswer.selectedAnswerId === correctAnswer.answerId;
  } else if (question.questionType === 'FILL_BLANK' && userAnswer && correctAnswer) {
    isUserCorrect = userAnswer.answerText?.trim().toLowerCase() === correctAnswer.answerText?.trim().toLowerCase();
  }

  let resultClass = 'unanswered';
  if (userAnswer) {
    if (question.questionType === 'ESSAY') resultClass = 'neutral';
    else resultClass = isUserCorrect ? 'correct' : 'incorrect';
  }

  return (
    <div className={cx('question-item', resultClass)}>
      <div className={cx('question-header')}>
        <span className={cx('question-label')}>Câu hỏi:</span>
        <div className={cx('question-text')}>{question.questionText}</div>
      </div>

      {/* TRẮC NGHIỆM */}
      {question.questionType === 'MCQ' && (
        <div className={cx('answers-options')}>
          {question.answers?.map((a) => {
            const isUserSelected = userAnswer?.selectedAnswerId === a.answerId;
            return (
              <div
                key={a.answerId}
                className={cx('answer-option', {
                  'is-correct': a.isCorrect,
                  'is-incorrect-choice': isUserSelected && !a.isCorrect,
                  'is-user-choice': isUserSelected
                })}
              >
                <span className={cx('option-marker')}>{a.answerLabel}.</span>
                <span className={cx('option-text')}>{a.answerText}</span>

                <div className={cx('option-tags')}>
                  {a.isCorrect && <span className={cx('tag', 'tag-correct')}>Đúng</span>}
                  {isUserSelected && !a.isCorrect && <span className={cx('tag', 'tag-wrong')}>Bạn chọn</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ĐIỀN TỪ */}
      {question.questionType === 'FILL_BLANK' && (
        <div className={cx('fill-blank-area')}>
          <div className={cx('user-answer')}>
            <strong>Câu trả lời của bạn:</strong>
            <span className={cx(userAnswer ? (isUserCorrect ? 'text-success' : 'text-danger') : 'text-muted')}>
              {userAnswer?.answerText || '(Chưa trả lời)'}
            </span>
          </div>
          {!isUserCorrect && correctAnswer && (
            <div className={cx('correct-answer-reveal')}>
              <strong>Đáp án đúng:</strong>
              <span className={cx('text-success')}>{correctAnswer.answerText}</span>
            </div>
          )}
        </div>
      )}

      {/* TỰ LUẬN */}
      {question.questionType === 'ESSAY' && (
        <div className={cx('essay-area')}>
          <strong>Bài làm của bạn:</strong>
          <div className={cx('essay-content')}>
            {userAnswer?.answerText || '(Chưa trả lời)'}
          </div>
        </div>
      )}

      {/* GIẢI THÍCH */}
      {question.explanation && (
        <div className={cx('explanation-box')}>
          <button className={cx('btn-toggle-explain')} onClick={() => setIsExplanationOpen(!isExplanationOpen)}>
            <strong>Giải thích:</strong>
            <IoChevronForwardOutline className={cx('arrow', { open: isExplanationOpen })} />
          </button>
          {isExplanationOpen && (
            <div
              className={cx('explain-content')}
              dangerouslySetInnerHTML={{ __html: question.explanation }}
            />
          )}
        </div>
      )}
    </div>
  );
}


export default TestResultPage;
