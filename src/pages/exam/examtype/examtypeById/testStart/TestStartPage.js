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
    const [userAnswers, setUserAnswers] = useState({});
    
    // CHÚ THÍCH: Khởi tạo timeLeft với giá trị `null`. 
    // `null` sẽ là trạng thái đặc biệt để ta biết rằng bài thi này không giới hạn thời gian.
    const [timeLeft, setTimeLeft] = useState(null); 
    
    const [preCountdown, setPreCountdown] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState("loading");

    axios.defaults.withCredentials = true;

    // --- BƯỚC 1: LẤY THÔNG TIN ĐỀ THI (Không thay đổi) ---
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

                    // CHÚ THÍCH: Đây là khối logic cốt lõi đã được thay đổi.
                    // 1. Kiểm tra xem `test.durationMinutes` có tồn tại và lớn hơn 0 không.
                    if (test.durationMinutes && test.durationMinutes > 0) {
                        // 2. Nếu có, đặt thời gian đếm ngược như bình thường.
                        setTimeLeft(test.durationMinutes * 60);
                    } else {
                        // 3. Nếu không (tức là 0, null, hoặc undefined), đặt timeLeft thành `null`.
                        //    Điều này báo hiệu rằng "không cần đếm ngược".
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

    // Countdown trước giờ mở (Không thay đổi)
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
        // CHÚ THÍCH: Thêm điều kiện `timeLeft === null`. 
        // Nếu `timeLeft` là `null` (không giới hạn), useEffect này sẽ không làm gì cả
        // và sẽ không có đồng hồ nào chạy.
        if (status !== "active" || timeLeft === null) return;

        // Logic tự động nộp bài khi hết giờ vẫn giữ nguyên
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
            
            {/* CHÚ THÍCH: Dòng này không cần sửa, nhưng logic của nó giờ đã phát huy tác dụng.
                Nó sẽ chỉ hiển thị đồng hồ khi `timeLeft` KHÔNG PHẢI là `null`.
                Nếu là bài không giới hạn thời gian, người dùng sẽ không thấy dòng này. */}
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