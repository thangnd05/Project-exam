import { useContext, useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Spinner, Alert } from "react-bootstrap";
import classNames from "classnames/bind";
import {
  IoArrowBackOutline,
  IoHomeOutline,
  IoListOutline,
  IoCloseOutline,
  IoCheckmarkCircleOutline,
} from "react-icons/io5";

import { AuthContext } from "~/shared/context/AuthContext";
import { getGuestSessionId, guestHeaders } from "~/shared/utils/guestSession";
import { getFullMediaUrl } from "~/shared/utils/mediaUrl";
import { useTestReview } from "./hooks/useTestReview";
import styles from "./TestReviewPage.module.scss";

const cx = classNames.bind(styles);

const isMsqCorrect = (q, userAnswer) => {
  const correctIds = (q.answers || []).filter((a) => a.isCorrect).map((a) => a.answerId).sort();
  const chosen = [...(userAnswer?.selectedAnswerIds || [])].sort();
  return (
    correctIds.length > 0 &&
    chosen.length === correctIds.length &&
    chosen.every((x, i) => x === correctIds[i])
  );
};

const getQuestionStatus = (q, userAnswer) => {
  const answered = !!(
    userAnswer &&
    (userAnswer.selectedAnswerId ||
      userAnswer.answerText ||
      (userAnswer.selectedAnswerIds && userAnswer.selectedAnswerIds.length))
  );
  if (!answered) return "unanswered";
  const correct = q.answers?.find((a) => a.isCorrect);
  if (q.questionType === "MSQ") {
    return isMsqCorrect(q, userAnswer) ? "correct" : "incorrect";
  }
  if (q.questionType === "MCQ") {
    return correct && userAnswer.selectedAnswerId === correct.answerId
      ? "correct"
      : "incorrect";
  }
  if (q.questionType === "FILL_BLANK") {
    const got = (userAnswer.answerText || "").trim().toLowerCase();
    const want = (correct?.answerText || "").trim().toLowerCase();
    return want && got === want ? "correct" : "incorrect";
  }
  return "answered";
};

const TestReviewPage = () => {
  const { userTestId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const isGuest = !authLoading && !isAuthenticated;
  const guestCfg = useMemo(
    () => (isGuest ? { headers: guestHeaders(getGuestSessionId()) } : {}),
    [isGuest],
  );

  const [showNav, setShowNav] = useState(false);

  const { data, isLoading, isError } = useTestReview(userTestId, {
    enabled: !authLoading,
    isGuest,
    guestCfg,
  });

  const test = data?.test ?? null;
  const userAnswers = data?.userAnswers ?? [];
  const canReview = data?.canReview ?? false;
  const loading = authLoading || isLoading;
  const error = isError
    ? "Không thể tải chi tiết câu hỏi. Vui lòng thử lại."
    : data?.notReviewable
      ? "Bạn chỉ có thể xem đáp án sau khi thời gian làm bài kết thúc."
      : "";

  const flatQuestions = useMemo(() => {
    const list = [];
    (test?.parts || []).forEach((part) => {
      (part.questionGroups || []).forEach((group) => {
        (group.questions || []).forEach((q) => {
          const ua = userAnswers.find(
            (a) => String(a.questionId) === String(q.questionId),
          );
          list.push({ questionId: q.questionId, status: getQuestionStatus(q, ua) });
        });
      });
    });
    return list;
  }, [test, userAnswers]);

  const correctCount = useMemo(
    () => flatQuestions.filter((q) => q.status === "correct").length,
    [flatQuestions],
  );

  const questionNumberMap = useMemo(() => {
    const map = new Map();
    flatQuestions.forEach((q, idx) => map.set(String(q.questionId), idx + 1));
    return map;
  }, [flatQuestions]);

  const scrollToQuestion = (qid) => {
    const el = document.getElementById(`rq-${qid}`);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - 90;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  useEffect(() => {
    if (loading || !test) return;
    const hash = window.location.hash;
    if (!hash) return;
    const elId = hash.slice(1);
    const timer = setTimeout(() => {
      const el = document.getElementById(elId);
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: y, behavior: "smooth" });
      el.classList.add(styles.highlight);
      setTimeout(() => el.classList.remove(styles.highlight), 1600);
    }, 120);
    return () => clearTimeout(timer);
  }, [loading, test]);

  const hasPassageContent = (passage, fallbackObj) => {
    const content =
      passage?.content ??
      passage?.passage_content ??
      fallbackObj?.content ??
      fallbackObj?.passage_content;
    const mediaList =
      passage?.passageMediaList ??
      passage?.passageMedias ??
      passage?.mediaList ??
      passage?.passage_media ??
      [];
    if (Array.isArray(mediaList) && mediaList.length > 0) return true;
    const singleUrl =
      passage?.mediaUrl ??
      passage?.media_url ??
      fallbackObj?.mediaUrl ??
      fallbackObj?.media_url;
    return Boolean(content || singleUrl);
  };

  const renderPassageText = (text, key) => (
    <div key={key} className={cx("passage-content")}>
      {String(text)
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((para, i) => (
          <p key={i} className={cx("passage-paragraph")}>{para}</p>
        ))}
    </div>
  );

  const renderPassage = (passage, fallbackObj) => {
    const content =
      passage?.content ??
      passage?.passage_content ??
      fallbackObj?.content ??
      fallbackObj?.passage_content;
    const translation =
      passage?.contentTranslation ??
      passage?.content_translation ??
      fallbackObj?.contentTranslation ??
      fallbackObj?.content_translation;
    const pType = passage?.passageType ?? passage?.passage_type ?? "READING";

    const mediaList =
      passage?.passageMediaList ??
      passage?.passageMedias ??
      passage?.mediaList ??
      passage?.passage_media ??
      [];
    const hasList = Array.isArray(mediaList) && mediaList.length > 0;

    const singleMediaUrl =
      passage?.mediaUrl ??
      passage?.media_url ??
      fallbackObj?.mediaUrl ??
      fallbackObj?.media_url ??
      fallbackObj?.audioUrl ??
      fallbackObj?.audio_url ??
      fallbackObj?.passageMediaUrl;

    const hasContent = !!content;
    const hasAnyMedia = hasList || !!singleMediaUrl;
    if (!hasContent && !hasAnyMedia) return null;

    const audioCount = hasList
      ? mediaList.filter(
          (x) => (x.mediaType ?? x.media_type ?? "").toUpperCase() === "AUDIO",
        ).length
      : 0;

    return (
      <div className={cx("passage-box")}>

        {content && renderPassageText(content, "main")}

        {hasList &&
          mediaList.map((m, idx) => {
            const type = (m.mediaType ?? m.media_type ?? "").toUpperCase();
            if (type === "TEXT") {
              const t = m.content ?? m.content_text;
              return t ? renderPassageText(t, `media-${idx}`) : null;
            }
            const url = m.mediaUrl ?? m.media_url;
            if (!url) return null;
            if (type === "AUDIO") {
              return (
                <div key={idx} className="mb-3">
                  <audio controls src={getFullMediaUrl(url)} className={cx("audio-player")} />
                </div>
              );
            }
            if (type === "IMAGE") {
              return (
                <div key={idx} className={cx("passage-image-box")}>
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
        {!hasList &&
          singleMediaUrl &&
          (pType === "LISTENING" || pType === "listening") && (
            <div className="mb-3">
              <audio controls src={getFullMediaUrl(singleMediaUrl)} className={cx("audio-player")} />
            </div>
          )}

        {translation && (
          <details className={cx("passage-translation")}>
            <summary>Bản dịch</summary>
            <div
              className={cx("passage-content")}
              style={{ whiteSpace: "pre-wrap", marginTop: 8 }}
            >
              {translation}
            </div>
          </details>
        )}
      </div>
    );
  };

  if (loading)
    return (
      <div className={cx("wrapper")}>
        <Container className={cx("state-box")}>
          <Spinner animation="border" variant="primary" />
          <p className="fw-bold text-primary">Đang tải chi tiết bài làm...</p>
        </Container>
      </div>
    );

  if (error)
    return (
      <div className={cx("wrapper")}>
        <Container>
          <Alert variant="warning">{error}</Alert>
          <button
            className={cx("back-btn")}
            onClick={() => navigate(`/tests/result/${userTestId}`)}
          >
            <IoArrowBackOutline /> Quay lại kết quả
          </button>
        </Container>
      </div>
    );

  return (
    <div className={cx("wrapper")}>
      <Container fluid className={cx("content")}>
        <div className={cx("back-bar")}>
          <button
            className={cx("back-btn")}
            onClick={() => navigate(`/tests/result/${userTestId}`)}
          >
            <IoArrowBackOutline /> Quay lại kết quả
          </button>
          <button className={cx("back-btn", "secondary")} onClick={() => navigate("/")}>
            <IoHomeOutline /> Trang chủ
          </button>
        </div>

        <h2 className={cx("section-title")}>Chi tiết bài làm</h2>

        {test?.parts?.map((part, i) => (
          <div key={part.testPartId || i} className={cx("part-section")}>
            {part.questionGroups?.map((group, groupIndex) => {
              const firstQ = group.questions?.[0];
              const splitLayout = hasPassageContent(group.passage, firstQ);

              const questionList = group.questions?.map((q) => {
                const userAnswer = userAnswers.find(
                  (ua) => String(ua.questionId) === String(q.questionId),
                );
                return (
                  <QuestionResult
                    key={q.questionId}
                    question={q}
                    number={questionNumberMap.get(String(q.questionId))}
                    userAnswer={userAnswer}
                    canReview={canReview}
                  />
                );
              });

              return (
                <div
                  key={group.passage?.passageId || groupIndex}
                  className={cx("group-section", { "split-layout": splitLayout })}
                >
                  {splitLayout ? (
                    <>
                      <div className={cx("passage-column")} aria-label="Tài liệu / Đoạn nghe">
                        {renderPassage(group.passage, firstQ)}
                      </div>
                      <div className={cx("question-column")}>{questionList}</div>
                    </>
                  ) : (
                    <>
                      {renderPassage(group.passage, firstQ)}
                      {questionList}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </Container>

      {flatQuestions.length > 0 && (
        <div className={cx("footer-actions")}>
          {showNav && (
            <div className={cx("footer-panel")}>
              <div className={cx("nav-card")}>
                <div className={cx("nav-header")}>
                  <IoListOutline />
                  <span>Danh sách câu hỏi</span>
                </div>
                <div className={cx("nav-grid")}>
                  {flatQuestions.map((q, idx) => (
                    <button
                      key={q.questionId}
                      type="button"
                      className={cx("nav-item", q.status)}
                      onClick={() => {
                        scrollToQuestion(q.questionId);
                        setShowNav(false);
                      }}
                      aria-label={`Câu ${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
                <div className={cx("nav-legend")}>
                  <span className={cx("legend-item")}>
                    <span className={cx("dot", "correct")} /> Đúng
                  </span>
                  <span className={cx("legend-item")}>
                    <span className={cx("dot", "incorrect")} /> Sai
                  </span>
                  <span className={cx("legend-item")}>
                    <span className={cx("dot", "unanswered")} /> Chưa làm
                  </span>
                </div>
              </div>
            </div>
          )}
          <div className={cx("footer-buttons")}>
            <Container className={cx("footer-buttons-inner")}>
              <button
                type="button"
                className={cx("btn-toggle-info", { active: showNav })}
                onClick={() => setShowNav((v) => !v)}
                aria-expanded={showNav}
              >
                {showNav ? <IoCloseOutline size={22} /> : <IoListOutline size={22} />}
                <span>{showNav ? "Ẩn" : "Danh sách câu"}</span>
              </button>
              <div className={cx("footer-score")}>
                <IoCheckmarkCircleOutline aria-hidden />
                <span>
                  {correctCount}/{flatQuestions.length} câu đúng
                </span>
              </div>
            </Container>
          </div>
        </div>
      )}
    </div>
  );
};

function QuestionResult({ question, number, userAnswer, canReview }) {
  const correctAnswer = question.answers?.find((a) => a.isCorrect);

  let isUserCorrect = false;
  if (question.questionType === "MCQ" && userAnswer && correctAnswer) {
    isUserCorrect = userAnswer.selectedAnswerId === correctAnswer.answerId;
  } else if (question.questionType === "MSQ" && userAnswer) {
    isUserCorrect = isMsqCorrect(question, userAnswer);
  }

  const answeredAny = !!(
    userAnswer &&
    (userAnswer.selectedAnswerId ||
      userAnswer.answerText ||
      (userAnswer.selectedAnswerIds && userAnswer.selectedAnswerIds.length))
  );
  let resultClass = "unanswered";
  if (answeredAny) {
    resultClass = isUserCorrect ? "correct" : "incorrect";
  }

  return (
    <div id={`rq-${question.questionId}`} className={cx("question-item", resultClass)}>
      <span className={cx("q-text")}>
        <strong>{number ? `Câu ${number}:` : "Câu hỏi:"}</strong>{" "}
        {question.questionText}
      </span>

      {question.questionType === "MCQ" && (
        <div className={cx("answers-options")}>
          {question.answers?.map((a) => {
            const isUserSelected = userAnswer?.selectedAnswerId === a.answerId;
            return (
              <div
                key={a.answerId}
                className={cx("answer-option", {
                  "is-correct": canReview && a.isCorrect,
                  "is-incorrect-choice": isUserSelected && !a.isCorrect,
                  "is-user-choice": isUserSelected,
                })}
              >
                {a.answerText?.trim()
                  ? `${a.answerLabel}. ${a.answerText}`
                  : a.answerLabel}
                {isUserSelected && <span className={cx("user-pill")}>(Bạn chọn)</span>}
              </div>
            );
          })}
        </div>
      )}

      {question.questionType === "MSQ" && (
        <div className={cx("answers-options")}>
          {question.answers?.map((a) => {
            const isUserSelected = (userAnswer?.selectedAnswerIds || []).includes(a.answerId);
            return (
              <div
                key={a.answerId}
                className={cx("answer-option", {
                  "is-correct": canReview && a.isCorrect,
                  "is-incorrect-choice": isUserSelected && !a.isCorrect,
                  "is-user-choice": isUserSelected,
                })}
              >
                {a.answerText?.trim()
                  ? `${a.answerLabel}. ${a.answerText}`
                  : a.answerLabel}
                {isUserSelected && <span className={cx("user-pill")}>(Bạn chọn)</span>}
              </div>
            );
          })}
        </div>
      )}

      {question.questionType === "FILL_BLANK" && (
        <div>
          <p className={cx("fill-row")}>
            <strong>Bạn trả lời:</strong>{" "}
            {userAnswer?.answerText || "(Chưa trả lời)"}
          </p>
          {canReview && correctAnswer && (
            <p className={cx("fill-row")}>
              <strong>Đáp án đúng:</strong> {correctAnswer.answerText}
            </p>
          )}
        </div>
      )}

      {canReview && question.explanation?.trim() && (
        <div className={cx("explanation-box")}>
          <strong>Giải thích:</strong> {question.explanation}
        </div>
      )}
    </div>
  );
}

export default TestReviewPage;
