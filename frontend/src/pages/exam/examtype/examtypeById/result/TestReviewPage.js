import { useContext, useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from '../../../../../api/axiosClient';
import { getUserTestMeta } from '../../../../../api/userTestApi';
import { getAnswersByUserTest } from '../../../../../api/userAnswerApi';
import { getUserTestInfo, getAdminTestById } from '../../../../../api/testApi';
import { getPassageMediaByPassageId } from '~/api/passageMediaApi';
import { getExamPartById } from '~/api/examPartApi';
import { Container, Spinner, Alert } from "react-bootstrap";
import classNames from "classnames/bind";
import {
  IoArrowBackOutline,
  IoHomeOutline,
  IoVolumeHighOutline,
} from "react-icons/io5";

import { AuthContext } from "~/context/AuthContext";
import { getGuestSessionId, guestHeaders } from "~/utils/guestSession";
import styles from "./TestReviewPage.module.scss";

const cx = classNames.bind(styles);

const getFullMediaUrl = (url) => {
  if (!url) return null;
  const cleanUrl = url.trim();
  if (cleanUrl.startsWith('http')) return cleanUrl;
  const backendUrl = axios.defaults.baseURL || process.env.REACT_APP_API_BASE_URL || '';
  return `${backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl}/${cleanUrl.startsWith('/') ? cleanUrl.slice(1) : cleanUrl}`;
};

const hasMediaList = (p) => {
  const list = p?.passageMedias ?? p?.passageMediaList ?? p?.passage_media;
  return Array.isArray(list) && list.length > 0;
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

  const [test, setTest] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [partNameMap, setPartNameMap] = useState({});
  const [canReview, setCanReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Nạp audio/ảnh từ bảng passage_media (API test không trả kèm media).
  const enrichTestWithPassageMedia = useCallback(async (testData) => {
    const parts = testData.parts || [];
    const passageIdsToFetch = new Set();
    parts.forEach((part) => {
      (part.questionGroups || []).forEach((group) => {
        const gpid = group.passage?.passageId ?? group.passage?.passage_id;
        if (gpid && !hasMediaList(group.passage)) passageIdsToFetch.add(gpid);
        (group.questions || []).forEach((q) => {
          const qpid = q.passage?.passageId ?? q.passage?.passage_id ?? q.passageId;
          if (qpid && !hasMediaList(q.passage)) passageIdsToFetch.add(qpid);
        });
      });
    });
    if (passageIdsToFetch.size === 0) return testData;

    const ids = [...passageIdsToFetch];
    const results = await Promise.all(
      ids.map((id) => getPassageMediaByPassageId(id).catch(() => [])),
    );
    const mediaMap = Object.fromEntries(ids.map((id, i) => [id, results[i]]));

    const enrichWrapper = (obj) => {
      const pid = obj?.passage?.passageId ?? obj?.passage?.passage_id ?? obj?.passageId;
      if (pid && mediaMap[pid]) {
        return {
          ...obj,
          passage: { ...(obj.passage || { passageId: pid }), passageMedias: mediaMap[pid] },
        };
      }
      return obj;
    };

    const enrichedParts = parts.map((part) => ({
      ...part,
      questionGroups: (part.questionGroups || []).map((group) => ({
        ...enrichWrapper(group),
        questions: (group.questions || []).map(enrichWrapper),
      })),
    }));
    return { ...testData, parts: enrichedParts };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    const fetchDetail = async () => {
      try {
        setLoading(true);

        const metaData = await getUserTestMeta(userTestId, isGuest, guestCfg);
        const testId = metaData.testId;

        // Check hạn review (endpoint public)
        const testInfo = await getUserTestInfo(testId);
        const now = new Date();
        const availableTo = testInfo.availableTo ? new Date(testInfo.availableTo) : null;
        const reviewable = !availableTo || now > availableTo;
        setCanReview(reviewable);

        if (!reviewable) {
          setError("Bạn chỉ có thể xem đáp án sau khi thời gian làm bài kết thúc.");
          return;
        }

        const [testData, answersData] = await Promise.all([
          getAdminTestById(testId),
          getAnswersByUserTest(userTestId, isGuest, guestCfg),
        ]);

        const enriched = await enrichTestWithPassageMedia({
          ...testData,
          parts: testData.parts || [],
        });

        setTest(enriched);
        setUserAnswers(answersData);

        // Nạp tên part từ ExamPart (admin DTO không kèm tên part).
        const examPartIds = [
          ...new Set(
            (enriched.parts || [])
              .map((p) => p.examPartId)
              .filter(Boolean),
          ),
        ];
        if (examPartIds.length > 0) {
          const parts = await Promise.all(
            examPartIds.map((id) => getExamPartById(id).catch(() => null)),
          );
          const nameMap = {};
          examPartIds.forEach((id, idx) => {
            const name = parts[idx]?.name;
            if (name) nameMap[id] = name;
          });
          setPartNameMap(nameMap);
        }
      } catch (err) {
        console.error(" Lỗi tải chi tiết:", err);
        setError("Không thể tải chi tiết câu hỏi. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [userTestId, authLoading, isGuest, guestCfg, enrichTestWithPassageMedia]);

  // Passage có content hoặc media → render layout 2 cột giống bài thi.
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
        {/* Audio: nghe lại đoạn hội thoại */}
        {hasList &&
          mediaList.map((m, idx) => {
            const url = m.mediaUrl ?? m.media_url;
            if (!url) return null;
            const type = (m.mediaType ?? m.media_type ?? "").toUpperCase();
            if (type === "AUDIO") {
              return (
                <div key={idx} className="mb-3">
                  <div className={cx("audio-label")}>
                    <IoVolumeHighOutline size={22} />
                    <span>NGHE {audioCount > 1 ? `(${idx + 1})` : "ĐOẠN HỘI THOẠI"}</span>
                  </div>
                  <audio controls src={getFullMediaUrl(url)} className={cx("audio-player")} />
                </div>
              );
            }
            return null;
          })}
        {!hasList &&
          singleMediaUrl &&
          (pType === "LISTENING" || pType === "listening") && (
            <div className="mb-3">
              <div className={cx("audio-label")}>
                <IoVolumeHighOutline size={22} />
                <span>NGHE ĐOẠN HỘI THOẠI</span>
              </div>
              <audio controls src={getFullMediaUrl(singleMediaUrl)} className={cx("audio-player")} />
            </div>
          )}

        {/* Ảnh minh hoạ */}
        {hasList &&
          mediaList.map((m, idx) => {
            const url = m.mediaUrl ?? m.media_url;
            if (!url) return null;
            const type = (m.mediaType ?? m.media_type ?? "").toUpperCase();
            if (type === "IMAGE") {
              return (
                <img
                  key={`img-${idx}`}
                  src={getFullMediaUrl(url)}
                  alt={`Passage ${idx + 1}`}
                  className={cx("passage-image")}
                />
              );
            }
            return null;
          })}

        {/* Script đoạn văn / hội thoại */}
        {content && <div className={cx("passage-content")}>{content}</div>}

        {/* Bản dịch (thu gọn) */}
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
      <Container>
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
            <h3 className={cx("part-title")}>
              {partNameMap[part.examPartId] || part.partName || `Phần ${i + 1}`}
            </h3>

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
    isUserCorrect = userAnswer.selectedAnswerId === correctAnswer.answerId;
  }

  let resultClass = "unanswered";
  if (userAnswer) {
    resultClass = isUserCorrect ? "correct" : "incorrect";
  }

  return (
    <div className={cx("question-item", resultClass)}>
      <span className={cx("q-text")}>
        <strong>Câu hỏi:</strong> {question.questionText}
      </span>

      {/* MCQ */}
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

      {/* Fill blank */}
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
