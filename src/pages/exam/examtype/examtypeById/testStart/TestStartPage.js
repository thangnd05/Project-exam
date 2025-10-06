import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../../hook/useAuth";

function TestStartPage() {
  const { testId } = useParams();
  const { user } = useAuth();
  const userId = user?.userId;
  const navigate = useNavigate();

  const [userTestId, setUserTestId] = useState(null);
  const [test, setTest] = useState({ parts: [] });
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [preCountdown, setPreCountdown] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("loading");

  axios.defaults.withCredentials = true;

  const getFullMediaUrl = (url) => {
    if (!url) return null;
    const cleanUrl = url.trim();
    if (cleanUrl.startsWith("http")) return cleanUrl;
    const backendUrl = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";
    const trimmedBackendUrl = backendUrl.endsWith("/") ? backendUrl.slice(0, -1) : backendUrl;
    const trimmedCleanUrl = cleanUrl.startsWith("/") ? cleanUrl.slice(1) : cleanUrl;
    return `${trimmedBackendUrl}/${trimmedCleanUrl}`;
  };

  // 🟢 Lấy đề thi + khôi phục state
  useEffect(() => {
    if (!testId || !userId) return;
    setStatus("loading");

    const savedState = sessionStorage.getItem(`userTestState-${testId}`);
    let restored = false;

    if (savedState) {
      const parsed = JSON.parse(savedState);
      setUserTestId(parsed.userTestId || null);
      setUserAnswers(parsed.userAnswers || {});
      if (parsed.timeLeft && parsed.lastSavedAt) {
        const elapsed = Math.floor((Date.now() - parsed.lastSavedAt) / 1000);
        const newTime = Math.max(0, parsed.timeLeft - elapsed);
        setTimeLeft(newTime);
      } else {
        setTimeLeft(parsed.timeLeft || null);
      }
      setStatus("active");
      restored = true;
    }

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
          return;
        }

        if (availableTo && now > availableTo) {
          setStatus("closed");
          return;
        }

        if (!restored) {
          const durationSeconds = (testData.durationMinutes || 0) * 60;
          let finalTime = durationSeconds;

          if (availableTo) {
            const diffSeconds = Math.floor((availableTo - now) / 1000);
            if (diffSeconds > 0) {
              finalTime = Math.min(durationSeconds, diffSeconds);
            } else {
              finalTime = 0;
            }
          }

          setTimeLeft(finalTime);
          setStatus("open");
        }
      })
      .catch((err) => {
        console.error("❌ Lỗi khi tải bài thi:", err);
        setStatus("error");
      });
  }, [testId, userId]);

  // 🟢 Tạo user_test khi bắt đầu
  useEffect(() => {
    if (status === "open" && userId && test?.testId) {
      setStatus("starting");

      const existing = sessionStorage.getItem(`userTest-${test.testId}`);
      if (existing) {
        setUserTestId(existing);
        setStatus("active");
        return;
      }

      axios
        .post("/api/user-tests", { testId: test.testId, userId })
        .then((res) => {
          const id = res.data.userTestId;
          setUserTestId(id);
          sessionStorage.setItem(`userTest-${test.testId}`, id);
          setStatus("active");
        })
        .catch((err) => {
          console.error("❌ Lỗi tạo userTest:", err);
          setStatus("error");
        });
    }
  }, [status, userId, test]);

  // 🟢 Tự động lưu
  useEffect(() => {
    if (status === "active" && userTestId) {
      const saveData = {
        userTestId,
        userAnswers,
        timeLeft,
        lastSavedAt: Date.now(),
      };
      sessionStorage.setItem(`userTestState-${testId}`, JSON.stringify(saveData));
    }
  }, [userAnswers, timeLeft, userTestId, status, testId]);

  // 🟢 Đếm ngược trước khi mở bài
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

  // 🟢 Đếm ngược làm bài
  useEffect(() => {
    if (status !== "active" || timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const now = new Date();
        const availableTo = test.availableTo ? new Date(test.availableTo) : null;

        if (availableTo && now > availableTo) {
          clearInterval(timer);
          alert("⏰ Hết hạn làm bài! Hệ thống sẽ tự động nộp.");
          handleSubmit();
          return 0;
        }

        if (prev <= 1) {
          clearInterval(timer);
          alert("⏳ Hết thời gian làm bài. Hệ thống sẽ tự động nộp.");
          handleSubmit();
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, timeLeft, test]);

  // 🟢 Cập nhật câu trả lời
  const handleAnswerChange = (questionId, type, value) => {
    const updatedAnswer =
      type === "MCQ"
        ? { selectedAnswerId: value, answerText: null }
        : { selectedAnswerId: null, answerText: value };
    setUserAnswers({ ...userAnswers, [questionId]: updatedAnswer });
  };

  // 🟢 Nộp bài
  const handleSubmit = async () => {
    if (!userTestId || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload = Object.entries(userAnswers).map(([questionId, ans]) => ({
        userTestId,
        questionId: parseInt(questionId),
        selectedAnswerId: ans.selectedAnswerId || null,
        answerText: ans.answerText || null,
      }));

      if (payload.length > 0) {
        await axios.post("/api/user-answers/batch", payload);
      }

      const res = await axios.post(`/api/user-tests/${userTestId}/submit`);
      const totalScore = res.data.totalScore;

      sessionStorage.removeItem(`userTest-${testId}`);
      sessionStorage.removeItem(`userTestState-${testId}`);

      navigate(`/tests/result/${userTestId}`, { state: { score: totalScore } });
    } catch (err) {
      console.error("❌ Lỗi khi nộp bài:", err);
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

  if (status === "loading") return <p>Đang tải bài thi...</p>;
  if (status === "error") return <p>Không thể tải bài thi.</p>;
  if (status === "closed") return <p>❌ Bài thi đã kết thúc.</p>;
  if (status === "locked") return <p>Bài thi chưa mở. Đợi: {formatTime(preCountdown)}</p>;
  if (status === "starting") return <p>Đang bắt đầu bài thi...</p>;
  if (status !== "active" || !test) return <p>Đang chuẩn bị bài thi...</p>;

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "auto" }}>
      <h2>{test.title}</h2>
      <p>{test.description}</p>

      {timeLeft !== null && (
        <p>
          ⏱ Thời gian còn lại: <strong>{formatTime(timeLeft)}</strong>
        </p>
      )}

      {test.parts?.map((part, i) => (
        <div key={part.testPartId} style={{ marginBottom: "2rem" }}>
          <h3>Phần {i + 1}</h3>
          {part.passage && (
            <div style={{ background: "#f8f9fa", padding: "1rem", borderRadius: "6px" }}>
              {part.passage.passageType === "LISTENING" && part.passage.mediaUrl && (
                <audio controls src={getFullMediaUrl(part.passage.mediaUrl)} style={{ width: "100%" }} />
              )}
              {part.passage.content && <p>{part.passage.content}</p>}
            </div>
          )}
          {part.questions?.map((q, qIndex) => (
            <div
              key={q.questionId}
              style={{
                marginTop: "1rem",
                padding: "1rem",
                border: "1px solid #ddd",
                borderRadius: "5px",
              }}
            >
              <strong>Câu {qIndex + 1}:</strong> {q.questionText}

              {q.questionType === "MCQ" &&
                q.answers?.map((a) => (
                  <div key={a.answerId}>
                    <label>
                      <input
                        type="radio"
                        name={`q-${q.questionId}`}
                        checked={userAnswers[q.questionId]?.selectedAnswerId === a.answerId}
                        onChange={() => handleAnswerChange(q.questionId, "MCQ", a.answerId)}
                      />{" "}
                      {`${a.answerLabel}. ${a.answerText}`}
                    </label>
                  </div>
                ))}

              {q.questionType === "FILL_BLANK" && (
                <input
                  type="text"
                  value={userAnswers[q.questionId]?.answerText || ""}
                  onChange={(e) => handleAnswerChange(q.questionId, "FILL_BLANK", e.target.value)}
                  placeholder="Nhập câu trả lời..."
                  style={{ padding: "0.5rem", width: "100%", marginTop: "0.5rem" }}
                />
              )}

              {q.questionType === "ESSAY" && (
                <textarea
                  value={userAnswers[q.questionId]?.answerText || ""}
                  onChange={(e) => handleAnswerChange(q.questionId, "ESSAY", e.target.value)}
                  rows={5}
                  style={{ width: "100%", marginTop: "0.5rem", padding: "0.5rem" }}
                />
              )}
            </div>
          ))}
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        style={{
          padding: "0.75rem 1.5rem",
          fontSize: "1.1rem",
          backgroundColor: "#28a745",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
        }}
      >
        {isSubmitting ? "Đang nộp bài..." : "Nộp bài"}
      </button>
    </div>
  );
}

export default TestStartPage;
