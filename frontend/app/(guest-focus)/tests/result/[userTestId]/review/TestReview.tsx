'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo } from "react";
import { Container, Spinner, Alert } from "react-bootstrap";
import classNames from "classnames/bind";
import { IoHomeOutline } from "react-icons/io5";

import { useAuth } from "@/app/hooks/useAuth";
import { getGuestSessionId, guestHeaders } from "@/app/utils/guestSession";
import { getFullMediaUrl } from "@/app/utils/mediaUrl";
import { useTestReview } from "./_hooks/useTestReview";
import ButtonPrime from "@/app/components/Button/ButtonPrime";
import ReviewQuestionCard from "@/app/components/Review/ReviewQuestionCard";
import ReviewFooterNav from "@/app/components/Review/ReviewFooterNav";
import { QuestionType } from "@/app/enums";
import type { QuestionAdminResponse, UserAnswerResponse } from "@/app/types";
import styles from "./TestReview.module.scss";
import reviewQStyles from "@/app/assets/styles/ReviewQuestions.module.scss";

const cx = classNames.bind(styles);

const isMsqCorrect = (q: QuestionAdminResponse, userAnswer?: UserAnswerResponse) => {
  const correctIds = (q.answers || []).filter((a) => a.isCorrect).map((a) => a.answerId).sort();
  const chosen = [...(userAnswer?.selectedAnswerIds || [])].sort();
  return (
    correctIds.length > 0 &&
    chosen.length === correctIds.length &&
    chosen.every((x, i) => x === correctIds[i])
  );
};

const getQuestionStatus = (q: QuestionAdminResponse, userAnswer?: UserAnswerResponse) => {
  const answered = !!(
    userAnswer &&
    (userAnswer.selectedAnswerId ||
      userAnswer.answerText ||
      (userAnswer.selectedAnswerIds && userAnswer.selectedAnswerIds.length))
  );
  if (!answered) return "unanswered";
  const correct = q.answers?.find((a) => a.isCorrect);
  if (q.questionType === QuestionType.MSQ) {
    return isMsqCorrect(q, userAnswer) ? "correct" : "incorrect";
  }
  if (q.questionType === QuestionType.MCQ) {
    return correct && userAnswer!.selectedAnswerId === correct.answerId
      ? "correct"
      : "incorrect";
  }
  if (q.questionType === QuestionType.FILL_BLANK) {
    const got = (userAnswer!.answerText || "").trim().toLowerCase();
    const want = (correct?.answerText || "").trim().toLowerCase();
    return want && got === want ? "correct" : "incorrect";
  }
  return "answered";
};

const TestReview = () => {
  const { userTestId } = useParams<{ userTestId: string }>();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const isGuest = !authLoading && !isAuthenticated;
  const guestCfg = useMemo(
    () => (isGuest ? { headers: guestHeaders(getGuestSessionId()) } : {}),
    [isGuest],
  );

  const {
    test,
    userAnswers,
    canReview,
    notReviewable,
    isLoading,
    isError,
  } = useTestReview(userTestId, {
    enabled: !authLoading,
    isGuest,
    guestCfg,
  });

  const loading = authLoading || isLoading;
  const error = isError
    ? "Không thể tải chi tiết câu hỏi. Vui lòng thử lại."
    : notReviewable
      ? "Bạn chỉ có thể xem đáp án sau khi thời gian làm bài kết thúc."
      : "";

  const flatQuestions = useMemo(() => {
    const list: Array<{ id: string; status: string }> = [];
    (test?.parts || []).forEach((part) => {
      (part.questionGroups || []).forEach((group) => {
        (group.questions || []).forEach((q) => {
          const ua = userAnswers.find(
            (a) => String(a.questionId) === String(q.questionId),
          );
          list.push({ id: q.questionId, status: getQuestionStatus(q, ua) });
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
    const map = new Map<string, number>();
    flatQuestions.forEach((q, idx) => map.set(String(q.id), idx + 1));
    return map;
  }, [flatQuestions]);

  const scrollToQuestion = (qid: string) => {
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
      el.classList.add(reviewQStyles.highlight);
      setTimeout(() => el.classList.remove(reviewQStyles.highlight), 1600);
    }, 120);
    return () => clearTimeout(timer);
  }, [loading, test]);

  const hasPassageContent = (passage: any, fallbackObj: any) => {
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

  const renderPassageText = (text: string, key: string) => (
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

  const renderPassage = (passage: any, fallbackObj: any) => {
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
          (x: any) => (x.mediaType ?? x.media_type ?? "").toUpperCase() === "AUDIO",
        ).length
      : 0;

    return (
      <div className={cx("passage-box")}>

        {content && renderPassageText(content, "main")}

        {hasList &&
          mediaList.map((m: any, idx: number) => {
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
                  <audio
                    controls
                    preload="none"
                    src={getFullMediaUrl(url) as string}
                    className={cx("audio-player")}
                  />
                </div>
              );
            }
            if (type === "IMAGE") {
              return (
                <div key={idx} className={cx("passage-image-box")}>
                  <img
                    src={getFullMediaUrl(url) as string}
                    alt={`Passage ${idx + 1}`}
                    className={cx("passage-image")}
                    loading="lazy"
                    decoding="async"
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
              <audio
                controls
                preload="none"
                src={getFullMediaUrl(singleMediaUrl) as string}
                className={cx("audio-player")}
              />
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
          <ButtonPrime
            variant="outline"
            onClick={() => router.push(`/tests/result/${userTestId}`)}
          >
            Quay lại kết quả
          </ButtonPrime>
        </Container>
      </div>
    );

  return (
    <div className={cx("wrapper")}>
      <Container fluid className={cx("content")}>
        <div className={cx("back-bar")}>
          <ButtonPrime
            variant="outline"
            onClick={() => router.push(`/tests/result/${userTestId}`)}
          >
            Quay lại kết quả
          </ButtonPrime>
          <ButtonPrime variant="ghost" onClick={() => router.push("/")}>
            <IoHomeOutline /> Trang chủ
          </ButtonPrime>
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

      <ReviewFooterNav
        items={flatQuestions}
        correctCount={correctCount}
        onSelect={scrollToQuestion}
      />
    </div>
  );
};

type QuestionResultProps = {
  question: QuestionAdminResponse;
  number?: number;
  userAnswer?: UserAnswerResponse;
  canReview: boolean;
};

function QuestionResult({ question, number, userAnswer, canReview }: QuestionResultProps) {
  const correctAnswer = question.answers?.find((a) => a.isCorrect);
  const selectedAnswerIds =
    question.questionType === QuestionType.MSQ
      ? userAnswer?.selectedAnswerIds || []
      : userAnswer?.selectedAnswerId
        ? [userAnswer.selectedAnswerId]
        : [];

  return (
    <ReviewQuestionCard
      id={`rq-${question.questionId}`}
      number={number}
      status={getQuestionStatus(question, userAnswer)}
      questionText={question.questionText}
      mode={question.questionType === QuestionType.FILL_BLANK ? "fill" : "options"}
      answers={question.answers || []}
      selectedAnswerIds={selectedAnswerIds}
      userAnswerText={userAnswer?.answerText}
      correctAnswerText={correctAnswer?.answerText}
      explanation={question.explanation}
      canReview={canReview}
    />
  );
}

export default TestReview;
