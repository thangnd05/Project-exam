import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";

function TestResultPage() {
  const { testId, userTestId } = useParams();
  const location = useLocation();
  const [test, setTest] = useState(null);
  const [score, setScore] = useState(location.state?.score || null);
  const [result, setResult] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);

  useEffect(() => {
    // Lấy chi tiết đề thi
    axios
      .get(`/api/tests/admintest/${testId}`)
      .then((res) => {
        const testData = { ...res.data, parts: res.data.parts || [] };
        setTest(testData);
      })
      .catch((err) => {
        console.error("Error loading result:", err.response ? err.response.data : err.message);
      });

    // Gọi API BE tính kết quả đúng/sai
    axios
      .get(`/api/user-answers/user-test/${userTestId}/result`)
      .then((res) => {
        setResult(res.data);
      })
      .catch((err) => {
        console.error("Error loading result summary:", err.response ? err.response.data : err.message);
      });

    // Lấy danh sách câu trả lời của user
    axios
      .get(`/api/user-answers/user-test/${userTestId}`)
      .then((res) => {
        setUserAnswers(res.data);
      })
      .catch((err) => {
        console.error("Error loading user answers:", err.response ? err.response.data : err.message);
      });
  }, [testId, userTestId]);

  if (!test) return <p>Loading result...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Kết quả bài thi</h2>
      {score !== null && <p><strong>Điểm của bạn: {score}</strong></p>}
      {result && (
        <>
          <p>Số câu đúng: {result.correct}</p>
          <p>Số câu sai: {result.wrong}</p>
          <p>Tổng số câu: {result.total}</p>
        </>
      )}

      {test.parts.map((part) => (
        <div key={part.testPartId} style={{ marginBottom: "2rem" }}>
          <h3>Phần: {part.examPartId}</h3>
          {part.questions?.map((q) => {
            const userAns = userAnswers.find((ua) => ua.questionId === q.questionId);

            return (
              <div
                key={q.questionId}
                style={{
                  marginBottom: "1rem",
                  padding: "1rem",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                }}
              >
                <p><strong>Câu hỏi:</strong> {q.questionText}</p>
                {q.answers?.map((a) => {
                  const isUserAnswer = userAns?.selectedAnswerId === a.answerId;
                  const isCorrect = a.isCorrect === true;

                  return (
                    <p
                      key={a.answerId}
                      style={{
                        color: isCorrect ? "green" : isUserAnswer ? "red" : "black",
                        fontWeight: isCorrect || isUserAnswer ? "bold" : "normal",
                      }}
                    >
                      {a.answerLabel}. {a.answerText}
                      {isUserAnswer && " (Bạn chọn)"}
                      {isCorrect && " (Đáp án đúng)"}
                    </p>
                  );
                })}
                {q.explanation && (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      padding: "0.5rem",
                      backgroundColor: "#f8f8f8",
                      borderRadius: "5px",
                    }}
                    dangerouslySetInnerHTML={{ __html: q.explanation }}
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default TestResultPage;
