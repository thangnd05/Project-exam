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
} from "react-icons/io5";

import styles from "./TestResultPage.module.scss";

const cx = classNames.bind(styles);

const TestResultPage = () => {
  const { userTestId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [testId, setTestId] = useState(null);
  const [test, setTest] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);

  const [showDetail, setShowDetail] = useState(false);
  const [canReview, setCanReview] = useState(false);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const [error, setError] = useState("");

  const formatTime = (start, end) => {
    if (!start || !end) return "--:--";

    const diff = Math.floor((new Date(end) - new Date(start)) / 1000);
    const m = Math.floor(diff / 60);
    const s = diff % 60;

    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getFullMediaUrl = (url) => {
    if (!url) return null;
    const cleanUrl = url.trim();
    if (cleanUrl.startsWith('http')) return cleanUrl;
    const backendUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
    return `${backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl}/${cleanUrl.startsWith('/') ? cleanUrl.slice(1) : cleanUrl}`;
  };
  // ================================
  // ✅ LOAD RESULT + CHECK REVIEW TIME
  // ================================
  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        // 1. Lấy thông tin tổng quan bài test (Chứa startedAt, finishedAt)
        const metaRes = await axios.get(`/api/user-tests/${userTestId}`);
        const metaData = metaRes.data; // Đây là chỗ có startedAt, finishedAt
        setTestId(metaData.testId);

        // 2. Lấy kết quả điểm số, số câu đúng/sai
        const res = await axios.get(
          `/api/user-answers/user-test/${userTestId}/result`
        );

        // ✅ KHẮC PHỤC: Gộp dữ liệu từ metaData vào result
        setResult({
          ...res.data,
          startedAt: metaData.startedAt,
          finishedAt: metaData.finishedAt,
        });

        // 3. Check hạn review (giữ nguyên code cũ của bạn)
        const testRes = await axios.get(`/api/tests/usertest/${metaData.testId}`);
        const testData = testRes.data;
        const now = new Date();
        const availableTo = testData.availableTo ? new Date(testData.availableTo) : null;
        setCanReview(!availableTo || now > availableTo);

      } catch (err) {
        console.error("❌ Lỗi tải kết quả:", err);
        setError("Không thể tải kết quả bài thi này");
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

  const hasPassageImage = (passage, fallbackObj) => {
    const mediaList =
      passage?.passageMediaList ??
      passage?.passageMedias ??
      passage?.mediaList ??
      passage?.passage_media ??
      [];
    if (
      Array.isArray(mediaList) &&
      mediaList.some(
        (m) => (m.mediaType ?? m.media_type ?? "").toUpperCase() === "IMAGE"
      )
    )
      return true;
    const singleUrl =
      passage?.mediaUrl ??
      passage?.media_url ??
      fallbackObj?.mediaUrl ??
      fallbackObj?.media_url;
    const pType =
      passage?.passageType ?? passage?.passage_type ?? fallbackObj?.passageType;
    return !!(singleUrl && (pType === "READING" || pType === "reading"));
  };

  const renderPassage = (passage, fallbackObj) => {
    const content =
      passage?.content ??
      passage?.passage_content ??
      fallbackObj?.content ??
      fallbackObj?.passage_content;
    const pType = passage?.passageType ?? passage?.passage_type ?? "READING";

    const mediaList =
      passage?.passageMediaList ??
      passage?.passageMedias ??
      passage?.mediaList ??
      passage?.passage_media ??
      [];
    const hasMediaList = Array.isArray(mediaList) && mediaList.length > 0;

    const singleMediaUrl =
      passage?.mediaUrl ??
      passage?.media_url ??
      fallbackObj?.mediaUrl ??
      fallbackObj?.media_url ??
      fallbackObj?.audioUrl ??
      fallbackObj?.audio_url ??
      fallbackObj?.passageMediaUrl;

    const hasContent = !!content;
    const hasAnyMedia = hasMediaList || !!singleMediaUrl;
    if (!hasContent && !hasAnyMedia) return null;

    return (
      <div className={cx("passage-box")}>
        {hasMediaList &&
          mediaList.map((m, idx) => {
            const url = m.mediaUrl ?? m.media_url;
            if (!url) return null;
            const type = (m.mediaType ?? m.media_type ?? "").toUpperCase();
            if (type === "AUDIO") {
              return (
                <div key={idx} className="mb-3">
                  <audio
                    src={getFullMediaUrl(url)}
                    className={cx("audio-player")}
                    controls
                  />
                </div>
              );
            }
            if (type === "IMAGE") {
              return (
                <div key={idx} className="mb-3 text-center">
                  <img
                    src={getFullMediaUrl(url)}
                    alt={`Passage ${idx + 1}`}
                    className={cx("passage-image")}
                  />
                </div>
              );
            }
            return null;
          })}
        {!hasMediaList &&
          singleMediaUrl &&
          (pType === "LISTENING" || pType === "listening") && (
            <div className="mb-4">
              <audio
                controls
                src={getFullMediaUrl(singleMediaUrl)}
                className={cx("audio-player")}
              />
            </div>
          )}
        {content && <div className={cx("passage-content")}>{content}</div>}
      </div>
    );
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
              <span className={cx("stat-val")}>
                {formatTime(result?.startedAt, result?.finishedAt)}
              </span>
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
              onClick={() => navigate(`/tests/history/${testId}`)}
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
                <h3 className={cx("part-title")}>Phần {i + 1}</h3>

                <div className={cx("question-groups-list")}>
                  {part.questionGroups?.map((group, groupIndex) => {
                    const firstQ = group.questions?.[0];
                    const passageHasImage = hasPassageImage(group.passage, firstQ);

                    return (
                      <div
                        key={groupIndex}
                        className={cx("question-group-wrapper", {
                          "split-layout": passageHasImage,
                        })}
                      >
                        {passageHasImage ? (
                          <div className={cx("split-container")}>
                            <div className={cx("passage-column")}>
                              {renderPassage(group.passage, firstQ)}
                            </div>
                            <div className={cx("question-column")}>
                              {group.questions?.map((q) => {
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
                        ) : (
                          <>
                            {renderPassage(group.passage, firstQ)}
                            {group.questions?.map((q) => {
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
                          </>
                        )}
                      </div>
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
