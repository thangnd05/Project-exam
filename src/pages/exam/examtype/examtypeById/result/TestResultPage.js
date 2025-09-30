import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";

/**
 * Component con để hiển thị kết quả cho MỘT câu hỏi.
 * Nó sẽ tự quyết định cách hiển thị dựa trên loại câu hỏi (MCQ hoặc FILL_BLANK).
 */
function QuestionResult({ question, userAnswer }) {
  // Tìm đáp án đúng từ danh sách đáp án của câu hỏi
  const correctAnswer = question.answers?.find(ans => ans.isCorrect);

  // Mặc định là sai, sau đó kiểm tra lại
  let isUserCorrect = false;

  if (question.questionType === 'MCQ' && userAnswer) {
    isUserCorrect = userAnswer.selectedAnswerId === correctAnswer?.answerId;
  } else if (question.questionType === 'FILL_BLANK' && userAnswer) {
    // So sánh không phân biệt hoa thường và bỏ qua khoảng trắng thừa
    isUserCorrect = userAnswer.answerText?.trim().toLowerCase() === correctAnswer?.answerText.trim().toLowerCase();
  }

  // Quyết định style viền và nền dựa trên việc đã trả lời và đúng/sai
  const containerStyle = {
    marginBottom: "1rem",
    padding: "1rem",
    border: `2px solid ${userAnswer ? (isUserCorrect ? "green" : "#dc3545") : "#ccc"}`, // Xanh/Đỏ/Xám
    borderRadius: "5px",
    backgroundColor: userAnswer ? (isUserCorrect ? "#e9f7ef" : "#fdecea") : "#f8f9fa", // Nền xanh/đỏ/xám nhạt
  };

  return (
    <div style={containerStyle}>
      <p><strong>Câu hỏi:</strong> {question.questionText}</p>

      {/* --- Hiển thị cho câu TRẮC NGHIỆM --- */}
      {question.questionType === 'MCQ' && (
        <>
          {question.answers?.map((a) => {
            const isUserSelected = userAnswer?.selectedAnswerId === a.answerId;
            const isCorrectAnswer = a.isCorrect;
            
            let styles = {};
            if (isCorrectAnswer) styles = { color: 'green', fontWeight: 'bold' };
            if (isUserSelected && !isCorrectAnswer) styles = { color: '#dc3545', fontWeight: 'bold', textDecoration: 'line-through' };
            
            return (
              <p key={a.answerId} style={styles}>
                {a.answerLabel}. {a.answerText}
                {isCorrectAnswer && !isUserSelected && " (Đáp án đúng)"}
                {isUserSelected && (isCorrectAnswer ? " (Bạn chọn đúng)" : " (Bạn chọn sai)")}
              </p>
            );
          })}
        </>
      )}

      {/* --- Hiển thị cho câu ĐIỀN TỪ --- */}
      {question.questionType === 'FILL_BLANK' && (
        <div style={{ marginTop: '0.5rem' }}>
          <p><strong>Câu trả lời của bạn: </strong>
            <span style={{ color: isUserCorrect ? 'green' : '#dc3545', fontWeight: 'bold' }}>
              {userAnswer?.answerText || "(Chưa trả lời)"}
            </span>
          </p>
          {!isUserCorrect && (
            <p><strong>Đáp án đúng: </strong>
              <span style={{ color: 'green', fontWeight: 'bold' }}>
                {correctAnswer?.answerText}
              </span>
            </p>
          )}
        </div>
      )}

      {/* --- Hiển thị giải thích (nếu có) --- */}
      {question.explanation && (
        <div style={{ marginTop: "0.5rem", padding: "0.5rem", backgroundColor: "#f0f0f0", borderTop: "1px solid #ddd" }}>
          <strong>Giải thích:</strong>
          <div dangerouslySetInnerHTML={{ __html: question.explanation }} />
        </div>
      )}
    </div>
  );
}

/**
 * Component chính của trang kết quả.
 */
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
        // Sử dụng Promise.all để gọi các API song song, tăng tốc độ tải trang
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
    <div style={{ padding: "2rem" }}>
      <h2>Kết quả bài thi: {test.title}</h2>
      
      {score !== null && <p style={{fontSize: '1.5rem'}}><strong>Điểm của bạn: {score}</strong></p>}
      
      {result && (
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
          <p><strong>Số câu đúng:</strong> {result.correct}</p>
          <p><strong>Số câu sai:</strong> {result.wrong}</p>
          <p><strong>Tổng số câu:</strong> {result.total}</p>
        </div>
      )}

      {test.parts.map((part) => (
        <div key={part.testPartId} style={{ marginTop: "2rem" }}>
          <h3>Phần: {part.examPartId}</h3>
          {part.questions?.map((q) => {
            const userAnswer = userAnswers.find((ua) => ua.questionId === q.questionId);
            // Sử dụng component con để hiển thị kết quả cho mỗi câu hỏi
            return <QuestionResult key={q.questionId} question={q} userAnswer={userAnswer} />;
          })}
        </div>
      ))}
    </div>
  );
}

export default TestResultPage;