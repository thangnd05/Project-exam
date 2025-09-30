import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../../hook/useAuth";

function TestStartPage() {
    const { testId } = useParams();
    const { userId } = useAuth();
    const navigate = useNavigate();

    const [userTestId, setUserTestId] = useState(null);
    const [test, setTest] = useState({ parts: [] });
    
    // ✅ BƯỚC 1: Cấu trúc lại state userAnswers
    // Mỗi câu trả lời sẽ là một object có selectedAnswerId (cho MCQ) và answerText (cho FILL_BLANK)
    const [userAnswers, setUserAnswers] = useState({});

    const [timeLeft, setTimeLeft] = useState(null);
    const [preCountdown, setPreCountdown] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState("loading");

    axios.defaults.withCredentials = true;

    // ... (Các useEffect để lấy thông tin test, đếm ngược... giữ nguyên như cũ) ...
    useEffect(() => {
        if (!testId) return;
        setStatus("loading");
        axios.get(`/api/tests/usertest/${testId}`, { params: { userId } })
            .then((res) => {
                // ... logic xử lý trạng thái test
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

    useEffect(() => {
        if (status === "open" && userId && test?.testId) {
            setStatus("starting");
            axios.post("/api/user-tests", { testId: test.testId, userId })
                .then((res) => {
                    setUserTestId(res.data.userTestId);
                    if (test.durationMinutes && test.durationMinutes > 0) {
                        setTimeLeft(test.durationMinutes * 60);
                    } else {
                        setTimeLeft(null);
                    }
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

    useEffect(() => {
        if (status !== "active" || timeLeft === null) return;
        if (timeLeft <= 0) {
            handleSubmit();
            return;
        }
        const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, status]);

    // ✅ BƯỚC 2: Cập nhật hàm handleAnswerChange để xử lý cả 2 loại
    const handleAnswerChange = (questionId, type, value) => {
        const currentAnswer = userAnswers[questionId] || {};
        let updatedAnswer;

        if (type === 'MCQ') {
            updatedAnswer = { ...currentAnswer, selectedAnswerId: value, answerText: null };
        } else if (type === 'FILL_BLANK') {
            updatedAnswer = { ...currentAnswer, selectedAnswerId: null, answerText: value };
        }

        setUserAnswers({
            ...userAnswers,
            [questionId]: updatedAnswer
        });
    };

    const handleSubmit = async () => {
        if (!userTestId || isSubmitting) return;
        setIsSubmitting(true);

        try {
            // ✅ Sửa lại logic tạo payload để gửi đúng định dạng
            const payload = Object.entries(userAnswers).map(([questionId, answerData]) => ({
                userTestId,
                questionId: parseInt(questionId),
                selectedAnswerId: answerData.selectedAnswerId || null,
                answerText: answerData.answerText || null,
            }));

            if (payload.length > 0) {
                await axios.post("/api/user-answers/batch", payload);
            }

            const res = await axios.post(`/api/user-tests/${userTestId}/submit`);
            const totalScore = res.data.totalScore;
            navigate(`/tests/${testId}/result/${userTestId}`, { state: { score: totalScore } });
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
    
    // ... (Phần render loading, error, etc. giữ nguyên) ...
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
                            <p><strong>Câu {index + 1}:</strong> {q.questionText.replace(/__/g, '___')}</p>
                            {q.passage && <div style={{ marginLeft: "1rem", fontStyle: "italic", whiteSpace: "pre-wrap" }}>{q.passage.content}</div>}
                            
                            {/* ✅ BƯỚC 3: Hiển thị input phù hợp với loại câu hỏi */}
                            {q.questionType === 'MCQ' && (
                                <ul>
                                    {q.answers?.map((a) => (
                                        <li key={a.answerId} style={{ listStyleType: "none", margin: "0.5rem 0" }}>
                                            <label>
                                                <input
                                                    type="radio"
                                                    name={`question-${q.questionId}`}
                                                    value={a.answerId}
                                                    checked={userAnswers[q.questionId]?.selectedAnswerId === a.answerId}
                                                    onChange={() => handleAnswerChange(q.questionId, 'MCQ', a.answerId)}
                                                />
                                                {a.answerLabel}. {a.answerText}
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {q.questionType === 'FILL_BLANK' && (
                                <div style={{ marginTop: '0.5rem' }}>
                                    <input
                                        type="text"
                                        name={`question-${q.questionId}`}
                                        value={userAnswers[q.questionId]?.answerText || ''}
                                        onChange={(e) => handleAnswerChange(q.questionId, 'FILL_BLANK', e.target.value)}
                                        placeholder="Nhập câu trả lời của bạn"
                                        style={{ padding: '0.5rem', width: '300px' }}
                                    />
                                </div>
                            )}
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