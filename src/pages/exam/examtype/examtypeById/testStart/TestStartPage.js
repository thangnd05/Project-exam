import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../../hook/useAuth";

function TestStartPage() {
  const { testId } = useParams();
  const { userId } = useAuth();
  const navigate = useNavigate();

  const [userTestId, setUserTestId] = useState(null);
  const [test, setTest] = useState({ parts: [] }); // mặc định có parts là mảng
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [preCountdown, setPreCountdown] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("loading");

  axios.defaults.withCredentials = true;

  // --- BƯỚC 1: LẤY THÔNG TIN ĐỀ THI ---
  useEffect(() => {
    if (!testId) return;
    setStatus("loading");

    axios
      .get(`/api/tests/usertest/${testId}`, { params: { userId } })
      .then((res) => {
        const testData = { ...res.data, parts: res.data.parts || [] };
        setTest(testData);

        const now = new Date();
        const availableFrom = testData.availableFrom ? new Date(testData.availableFrom) : null;
        const availableTo = testData.availableTo ? new Date(testData.availableTo) : null;

        if (availableFrom && now < availableFrom) {
          setStatus("locked");
          setPreCountdown(Math.floor((availableFrom - now) / 1000));
        } else if (availableTo && now > availableTo) {
          setStatus("closed");
        } else {
          setStatus("open");
        }
      })
      .catch((err) => {
        console.error("Lỗi khi tải thông tin bài thi:", err);
        setStatus("error");
      });
  }, [testId, userId]);

  // --- BƯỚC 3: TẠO USERTEST KHI OPEN ---
  useEffect(() => {
    if (status === "open" && userId && test?.testId) {
      setStatus("starting");
      axios
        .post("/api/user-tests", { testId: test.testId, userId })
        .then((res) => {
          setUserTestId(res.data.userTestId);
          setTimeLeft(test.durationMinutes * 60);
          setStatus("active");
        })
        .catch((err) => {
          if (err.response && err.response.data) {
            alert(err.response.data);
            navigate(-1);
          } else {
            setStatus("error");
          }
        });
    }
  }, [status, userId, test, navigate]);

  // Countdown trước giờ mở
  useEffect(() => {
    if (status !== "locked" || preCountdown === null) return;
    if (preCountdown <= 0) {
      setStatus("open");
      setPreCountdown(null);
      return;
    }
    const timer = setInterval(() => setPreCountdown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [preCountdown, status]);

  // Countdown làm bài
  useEffect(() => {
    if (status !== "active" || timeLeft === null) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, status]);

  const handleAnswerChange = (questionId, answerId) => {
    setUserAnswers({ ...userAnswers, [questionId]: answerId });
  };

  const handleSubmit = async () => {
    if (!userTestId || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload = Object.entries(userAnswers).map(([questionId, answerId]) => ({
        userTestId,
        questionId: parseInt(questionId),
        selectedAnswerId: answerId,
        answerText: null,
      }));

      if (payload.length > 0) {
        await axios.post("/api/user-answers/batch", payload);
      }

      const res = await axios.post(`/api/user-tests/${userTestId}/submit`);
      const totalScore = res.data.totalScore;
      navigate(`/test/${testId}/result/${userTestId}`, { state: { score: totalScore } });
    } catch (err) {
      console.error("Lỗi khi nộp bài:", err);
      alert("Nộp bài thất bại! Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // ----- PHẦN HIỂN THỊ UI DỰA TRÊN TRẠNG THÁI -----
  if (status === "loading") return <p>Đang tải thông tin bài thi...</p>;
  if (status === "error") return <p>Không thể tải được thông tin bài thi. Vui lòng thử lại.</p>;
  if (status === "closed") return <p>Bài kiểm tra này đã kết thúc.</p>;
  if (status === "locked") return <p>Bài thi chưa mở. Vui lòng đợi: {formatTime(preCountdown)}</p>;
  if (status === "starting") return <p>Đang bắt đầu phiên làm bài của bạn...</p>;
  if (status !== "active" || !test) return <p>Đang chuẩn bị bài thi...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>{test.title}</h2>
      <p>{test.description}</p>
      {timeLeft !== null && <p>Thời gian còn lại: <strong>{formatTime(timeLeft)}</strong></p>}

      {test.parts?.map((part) => (
        <div key={part.testPartId} style={{ marginBottom: "2rem" }}>
          <h3>Phần: {part.examPartId}</h3>
          {part.questions?.map((q, index) => (
            <div key={q.questionId} style={{ marginBottom: "1rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "5px" }}>
              <p><strong>Câu {index + 1}:</strong> {q.questionText}</p>
              {q.passage && <div style={{ marginLeft: "1rem", fontStyle: "italic", whiteSpace: "pre-wrap" }}>{q.passage.content}</div>}
              <ul>
                {q.answers?.map((a) => (
                  <li key={a.answerId} style={{ listStyleType: "none", margin: "0.5rem 0" }}>
                    <label>
                      <input
                        type="radio"
                        name={`question-${q.questionId}`}
                        value={a.answerId}
                        checked={userAnswers[q.questionId] === a.answerId}
                        onChange={() => handleAnswerChange(q.questionId, a.answerId)}
                      />
                      {a.answerLabel}. {a.answerText}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        style={{ padding: "0.5rem 1rem", fontSize: "1rem", backgroundColor: "#28a745", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}
      >
        {isSubmitting ? "Đang nộp bài..." : "Nộp bài"}
      </button>
    </div>
  );
}

export default TestStartPage;
