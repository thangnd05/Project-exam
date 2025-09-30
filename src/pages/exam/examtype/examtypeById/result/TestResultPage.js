import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import "./TestResultPage.scss";

// Component con QuestionResult
function QuestionResult({ question, userAnswer }) {
  const correctAnswer = question.answers?.find(ans => ans.isCorrect);
  let isUserCorrect = false;
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);

  if (question.questionType === 'MCQ' && userAnswer) {
    isUserCorrect = userAnswer.selectedAnswerId === correctAnswer?.answerId;
  } else if (question.questionType === 'FILL_BLANK' && userAnswer) {
    isUserCorrect = userAnswer.answerText?.trim().toLowerCase() === correctAnswer?.answerText.trim().toLowerCase();
  }

  const toggleExplanation = () => {
    setIsExplanationOpen(!isExplanationOpen);
  };

  return (
    <div className={`question-result ${userAnswer ? (isUserCorrect ? 'correct' : 'incorrect') : 'unanswered'}`}>
      <p className="question-text"><strong>Câu hỏi:</strong> {question.questionText}</p>
      {question.questionType === 'MCQ' && (
        <>
          {question.answers?.map((a) => {
            const isUserSelected = userAnswer?.selectedAnswerId === a.answerId;
            const isCorrectAnswer = a.isCorrect;
            return (
              <p key={a.answerId} className={`answer ${isCorrectAnswer ? 'correct-answer' : ''} ${isUserSelected && !isCorrectAnswer ? 'incorrect-answer' : ''}`}>
                {a.answerLabel}. {a.answerText}
                {isCorrectAnswer && !isUserSelected && " (Đáp án đúng)"}
                {isUserSelected && (isCorrectAnswer ? " (Bạn chọn đúng)" : " (Bạn chọn sai)")}
              </p>
            );
          })}
        </>
      )}
      {question.questionType === 'FILL_BLANK' && (
        <div className="fill-blank">
          <p><strong>Câu trả lời của bạn: </strong>
            <span className={isUserCorrect ? 'correct-answer' : 'incorrect-answer'}>
              {userAnswer?.answerText || "(Chưa trả lời)"}
            </span>
          </p>
          {!isUserCorrect && (
            <p><strong>Đáp án đúng: </strong>
              <span className="correct-answer">
                {correctAnswer?.answerText}
              </span>
            </p>
          )}
        </div>
      )}
      {question.explanation && (
        <div className="explanation">
          <div 
            className={`toggle-explanation ${isExplanationOpen ? 'open' : ''}`} 
            onClick={toggleExplanation}
          >
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
  const [score, setScore] = useState(location.state?.score || null);
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
        console.error("Error loading result page data:", err.response ? err.response.data : err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [testId, userTestId]);

  if (loading) return <p>Đang tải kết quả...</p>;
  if (!test) return <p>Không thể tải được thông tin bài thi.</p>;

  return (
    <div className="test-result-page">
      <h2>Kết quả bài thi: {test.title}</h2>
      
      {score !== null && <p className="score"><strong>Điểm của bạn: {score}</strong></p>}
      
      {result && (
        <div className="result-stats">
          <p><strong>Số câu đúng:</strong> {result.correct}</p>
          <p><strong>Số câu sai:</strong> {result.wrong}</p>
          <p><strong>Tổng số câu:</strong> {result.total}</p>
        </div>
      )}

      {test.parts.map((part) => (
        <div key={part.testPartId} className="test-part">
          <h3>Phần: {part.examPartId}</h3>
          
          {part.passage && (
            <div className="passage">
              <h4>Đoạn văn đã cho:</h4>
              <div className="passage-content">
                {part.passage.content}
              </div>
              {part.passage.mediaUrl && <img src={part.passage.mediaUrl} alt="passage media" className="passage-image" />}
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