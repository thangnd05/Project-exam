import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Container, Spinner, Alert } from "react-bootstrap";
import classNames from "classnames/bind";
import {
  IoCheckmarkCircle,
  IoHomeOutline,
  IoStatsChartOutline,
  IoTimeOutline,
  IoSchoolOutline,
  IoLockClosedOutline,
  IoChevronForwardOutline,
} from "react-icons/io5";

import styles from "./TestResultPage.module.scss";

const cx = classNames.bind(styles);

const TestResultPage = () => {
  const { userTestId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [test, setTest] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);

  const [showDetail, setShowDetail] = useState(false);
  const [canReview, setCanReview] = useState(false);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const [error, setError] = useState("");

  // ================================
  // ✅ LOAD RESULT + CHECK REVIEW TIME
  // ================================
  useEffect(() => {
    const fetchResult = async () => {
      try {
        // 1. Lấy meta userTest
        const metaRes = await axios.get(`/api/user-tests/${userTestId}`);
        const testId = metaRes.data.testId;

        // 2. ✅ Lấy result đúng endpoint (API cũ)
        const res = await axios.get(
          `/api/user-answers/user-test/${userTestId}/result`
        );

        setResult(res.data);

        // 3. Check hạn kết thúc bài thi
        const testRes = await axios.get(`/api/tests/usertest/${testId}`);
        const testData = testRes.data;

        const now = new Date();
        const availableTo = testData.availableTo
          ? new Date(testData.availableTo)
          : null;

        // Review được nếu hết hạn hoặc không có hạn
        const reviewAllowed = !availableTo || now > availableTo;
        setCanReview(reviewAllowed);
      } catch (err) {
        console.error("❌ Lỗi tải kết quả:", err);
        setError("Không thể tải kết quả bài thi này 😢");
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [userTestId]);

  // ================================
  // ✅ SHOW DETAIL QUESTIONS
  // ================================
  const handleShowDetail = async () => {
    if (!canReview) {
      alert("Bạn chỉ có thể xem đáp án sau khi thời gian làm bài kết thúc.");
      return;
    }

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
      console.error("❌ Lỗi tải chi tiết:", err);
      alert("Không thể tải chi tiết câu hỏi. Vui lòng thử lại.");
    } finally {
      setDetailLoading(false);
    }
  };

  // ================================
  // UI LOADING / ERROR
  // ================================
  if (loading)
    return (
      <div className={cx("wrapper")}>
        <Container className="d-flex flex-column align-items-center justify-content-center">
          <Spinner animation="border" />
          <p className="mt-3 fw-bold text-primary">
            Đang tổng hợp điểm số của bạn...
          </p>
        </Container>
      </div>
    );

  if (error)
    return (
      <div className={cx("wrapper")}>
        <Container>
          <Alert variant="danger">{error}</Alert>
          <button className="btn btn-primary mt-3" onClick={() => navigate("/")}>
            Quay lại trang chủ
          </button>
        </Container>
      </div>
    );

  // ================================
  // MAIN UI
  // ================================
  return (
    <div className={cx("wrapper")}>
      <Container>
        {/* ================= RESULT CARD ================= */}
        <div className={cx("result-card")}>
          <div className={cx("icon-success")}>
            <IoCheckmarkCircle />
          </div>

          <h1>Hoàn thành bài thi!</h1>

          {/* SCORE */}
          <div className={cx("score-display")}>
            <span className={cx("label")}>Điểm số</span>
            <div className={cx("points")}>
              {result?.totalScore?.toFixed(2) ||
                location.state?.score?.toFixed(2) ||
                "0.00"}
            </div>
          </div>

          {/* STATS */}
          <div className={cx("stats-grid")}>
            <div className={cx("stat-item", "correct")}>
              <IoCheckmarkCircle size={24} />
              <span className={cx("stat-val")}>{result?.correct || 0}</span>
              <span className={cx("stat-label")}>Câu đúng</span>
            </div>

            <div className={cx("stat-item", "wrong")}>
              <IoStatsChartOutline size={24} />
              <span className={cx("stat-val")}>{result?.wrong || 0}</span>
              <span className={cx("stat-label")}>Câu sai</span>
            </div>

            <div className={cx("stat-item", "total")}>
              <IoSchoolOutline size={24} />
              <span className={cx("stat-val")}>{result?.total || 0}</span>
              <span className={cx("stat-label")}>Tổng số câu</span>
            </div>

            <div className={cx("stat-item")}>
              <IoTimeOutline size={24} />
              <span className={cx("stat-val")}>--</span>
              <span className={cx("stat-label")}>Thời gian</span>
            </div>
          </div>

          {/* ACTIONS */}
          <div className={cx("actions")}>
            {!canReview && (
              <div className={cx("lock-message")}>
                <IoLockClosedOutline />
                <span>
                  Đáp án sẽ hiển thị sau khi thời gian làm bài kết thúc.
                </span>
              </div>
            )}

            <button
              className={cx("btn-detail", { "is-locked": !canReview })}
              onClick={handleShowDetail}
              disabled={detailLoading}
            >
              {detailLoading ? (
                <Spinner animation="border" size="sm" />
              ) : !canReview ? (
                <IoLockClosedOutline />
              ) : (
                <IoStatsChartOutline />
              )}

              {showDetail ? "Ẩn chi tiết" : "Xem đáp án & giải thích"}
            </button>

            <button className={cx("btn-home")} onClick={() => navigate("/")}>
              <IoHomeOutline /> Trang chủ
            </button>

            <button
              className={cx("btn-review")}
              onClick={() => navigate("/my-test")}
            >
              <IoSchoolOutline /> Lịch sử bài thi
            </button>
          </div>
        </div>

        {/* ================= DETAIL SECTION ================= */}
        {showDetail && test && (
          <div className={cx("detail-section")}>
            <h2 className={cx("section-title")}>Chi tiết bài làm</h2>

            {test.parts?.map((part, i) => (
              <div key={part.testPartId} className={cx("test-part")}>
                <h3>Phần {i + 1}</h3>

                <div className={cx("questions-list")}>
                  {part.questions?.map((q) => {
                    // ✅ FIX MATCH ID STRING/NUMBER
                    const userAnswer = userAnswers.find(
                      (ua) =>
                        String(ua.questionId) === String(q.questionId)
                    );

                    return (
                      <QuestionResult
                        key={q.questionId}
                        question={q}
                        userAnswer={userAnswer}
                        canReview={canReview}
                      />
                    );
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

// =============================
// QUESTION COMPONENT
// =============================
function QuestionResult({ question, userAnswer, canReview }) {
  const correctAnswer = question.answers?.find((a) => a.isCorrect);

  let isUserCorrect = false;

  if (question.questionType === "MCQ" && userAnswer && correctAnswer) {
    isUserCorrect =
      userAnswer.selectedAnswerId === correctAnswer.answerId;
  }

  let resultClass = "unanswered";
  if (userAnswer) {
    resultClass = isUserCorrect ? "correct" : "incorrect";
  }

  return (
    <div className={cx("question-item", resultClass)}>
      <p>
        <strong>Câu hỏi:</strong> {question.questionText}
      </p>

      {/* MCQ */}
      {question.questionType === "MCQ" && (
        <div className={cx("answers-options")}>
          {question.answers?.map((a) => {
            const isUserSelected =
              userAnswer?.selectedAnswerId === a.answerId;

            return (
              <div
                key={a.answerId}
                className={cx("answer-option", {
                  "is-correct": canReview && a.isCorrect,
                  "is-incorrect-choice":
                    isUserSelected && !a.isCorrect,
                  "is-user-choice": isUserSelected,
                })}
              >
                {a.answerLabel}. {a.answerText}
              </div>
            );
          })}
        </div>
      )}

      {/* Fill blank */}
      {question.questionType === "FILL_BLANK" && (
        <div>
          <p>
            <strong>Bạn trả lời:</strong>{" "}
            {userAnswer?.answerText || "(Chưa trả lời)"}
          </p>

          {canReview && correctAnswer && (
            <p>
              <strong>Đáp án đúng:</strong> {correctAnswer.answerText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default TestResultPage;
