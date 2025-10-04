import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import "./TestResultPage.scss";

function QuestionResult({ question, userAnswer }) {
  const correctAnswer = question.answers?.find(ans => ans.isCorrect);
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  let isUserCorrect = false;

  if (question.questionType === 'MCQ' && userAnswer && correctAnswer) {
    isUserCorrect = userAnswer.selectedAnswerId === correctAnswer.answerId;
  } else if (question.questionType === 'FILL_BLANK' && userAnswer && correctAnswer) {
    isUserCorrect = userAnswer.answerText?.trim().toLowerCase() === correctAnswer.answerText?.trim().toLowerCase();
  }

  const toggleExplanation = () => setIsExplanationOpen(!isExplanationOpen);

  let resultClass = 'unanswered';
  if (userAnswer) {
    if (question.questionType === 'ESSAY') {
      resultClass = 'neutral';
    } else {
      resultClass = isUserCorrect ? 'correct' : 'incorrect';
    }
  }

  return (
    <div className={`question-result ${resultClass}`}>
      <p className="question-text"><strong>Câu hỏi:</strong> {question.questionText}</p>

      {/* === CÂU TRẮC NGHIỆM === */}
      {question.questionType === 'MCQ' && (
        <>
          {question.answers?.map((a) => {
            const isUserSelected = userAnswer?.selectedAnswerId === a.answerId;
            const isCorrectAnswer = a.isCorrect;
            return (
              <div
                key={a.answerId}
                className={`answer ${isCorrectAnswer ? 'correct-answer' : ''} ${isUserSelected && !isCorrectAnswer ? 'incorrect-choice' : ''}`}
              >
                <span className="answer-text">
                  {a.answerLabel}. {a.answerText}
                </span>
                <div className="answer-tags">
                  {isCorrectAnswer && <span className="tag correct-tag">✅ Đáp án đúng</span>}
                  {isUserSelected && !isCorrectAnswer && <span className="tag incorrect-tag">🟡 Bạn chọn</span>}
                  {isUserSelected && isCorrectAnswer && <span className="tag your-choice-tag">🟢 Bạn chọn & đúng</span>}
                </div>
              </div>
            );
          })}
          {!userAnswer && <p className="unanswered-text">Bạn đã bỏ qua câu này.</p>}
        </>
      )}

      {/* === CÂU ĐIỀN VÀO CHỖ TRỐNG === */}
      {question.questionType === 'FILL_BLANK' && (
        <div className="fill-blank-result">
          <p>
            <strong>Câu trả lời của bạn: </strong>
            <span className={userAnswer ? (isUserCorrect ? 'correct-text' : 'incorrect-text') : ''}>
              {userAnswer?.answerText || "(Chưa trả lời)"}
            </span>
          </p>
          {!isUserCorrect && correctAnswer && (
            <p>
              <strong>Đáp án đúng: </strong>
              <span className="correct-text">{correctAnswer.answerText}</span>
            </p>
          )}
        </div>
      )}

      {/* === CÂU TỰ LUẬN === */}
      {question.questionType === 'ESSAY' && (
        <div className="essay-result">
          <p><strong>Bài làm của bạn:</strong></p>
          <div className="essay-content">
            {userAnswer?.answerText || "(Chưa trả lời)"}
          </div>
        </div>
      )}

      {/* === GIẢI THÍCH === */}
      {question.explanation && (
        <div className="explanation">
          <div className="toggle-explanation" onClick={toggleExplanation}>
            <strong>Giải thích:</strong> <span className="arrow">{isExplanationOpen ? '▼' : '▶'}</span>
          </div>
          {isExplanationOpen && (
            <div className="explanation-content" dangerouslySetInnerHTML={{ __html: question.explanation }} />
          )}
        </div>
      )}
    </div>
  );
}

function TestResultPage() {
  const { testId, userTestId } = useParams();
  const location = useLocation();
  const [test, setTest] = useState(null);
  const [score] = useState(location.state?.score || null);
  const [result, setResult] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const [testRes, resultRes, userAnswersRes] = await Promise.all([
          axios.get(`/api/tests/admintest/${testId}`),
          axios.get(`/api/user-answers/user-test/${userTestId}/result`),
          axios.get(`/api/user-answers/user-test/${userTestId}`),
        ]);

        setTest({ ...testRes.data, parts: testRes.data.parts || [] });
        setResult(resultRes.data);
        setUserAnswers(userAnswersRes.data);
      } catch (err) {
        console.error("Error loading result page data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (testId && userTestId) fetchResults();
  }, [testId, userTestId]);

  if (loading) return <p>Đang tải kết quả...</p>;
  if (!test) return <p>Không thể tải được thông tin bài thi.</p>;

  return (
    <div className="test-result-page">
      <h2>Kết quả bài thi: {test.title}</h2>

      {score !== null && <p className="score"><strong>Điểm của bạn: {score.toFixed(2)}</strong></p>}

      {result && (
        <div className="result-stats">
          <span><strong>Đúng:</strong> {result.correct}</span>
          <span><strong>Sai:</strong> {result.wrong}</span>
          <span><strong>Tổng:</strong> {result.total}</span>
        </div>
      )}

      {test.parts.map((part, partIndex) => (
        <div key={part.testPartId} className="test-part">
          <h3>Phần {partIndex + 1}</h3>

          {part.passage && (
            <div className="passage">
              <h4>{part.passage.passageType?.toUpperCase() === 'LISTENING' ? 'Bài nghe đã cho' : 'Đoạn văn đã cho'}:</h4>
              {part.passage.passageType?.toUpperCase() === 'LISTENING' && part.passage.mediaUrl && (
                <audio controls src={part.passage.mediaUrl} style={{ width: "100%", marginBottom: "1rem" }} />
              )}
              {part.passage.content && <div className="passage-content">{part.passage.content}</div>}
            </div>
          )}

          {part.questions?.map((q) => {
            const userAnswer = userAnswers.find((ua) => ua.questionId === q.questionId);
            return <QuestionResult key={q.questionId} question={q} userAnswer={userAnswer} />;
          })}
        </div>
      ))}
    </div>
  );
}

export default TestResultPage;
