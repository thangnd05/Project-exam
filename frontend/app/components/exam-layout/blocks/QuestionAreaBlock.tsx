'use client';

import { useLayoutEffect, useRef } from 'react';
import { Form } from 'react-bootstrap';
import classNames from 'classnames/bind';

import { getFullMediaUrl } from '@/app/utils/mediaUrl';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import GatedAudioPlayer from '@/app/components/exam-layout/blocks/GatedAudioPlayer';
import { MediaType, PassageType, QuestionType } from '@/app/enums';
import type { PassageMediaResponse } from '@/app/types';
import type {
  AnswerChangeHandler,
  ExamFlowStep,
  ExamPart,
  ExamPassage,
  ExamQuestion,
  ExamUserAnswers,
  QuestionIndexMap,
} from '@/app/components/exam-layout/examLayoutTypes';
import type { LayoutQuestionArea } from '@/app/components/exam-layout/layoutSchema';
// Các block dùng chung class của trang làm bài; scss đặt cạnh engine để bớt import chéo.
import styles from '@/app/components/exam-layout/TestStart.module.scss';

const cx = classNames.bind(styles);

// BE trả PassageResponse { content, mediaUrl, passageType, passageMedias[] }
// và PassageMediaResponse { mediaUrl, mediaType, content }.
const mediaListOf = (passage: ExamPassage): PassageMediaResponse[] =>
  Array.isArray(passage?.passageMedias) ? passage!.passageMedias! : [];

const isListening = (passage: ExamPassage) => passage?.passageType === PassageType.LISTENING;

const getAudioUrls = (passage: ExamPassage): string[] => {
  const urls = mediaListOf(passage)
    .filter((m) => m?.mediaType === MediaType.AUDIO && m?.mediaUrl)
    .map((m) => m.mediaUrl as string);
  if (urls.length === 0 && passage?.mediaUrl && isListening(passage)) {
    urls.push(passage.mediaUrl);
  }
  return urls;
};

type QuestionAreaBlockProps = {
  isPractice?: boolean;
  visibleParts: ExamPart[];
  questionIndexMap: QuestionIndexMap;
  userAnswers: ExamUserAnswers;
  handleAnswerChange: AnswerChangeHandler;
  config?: LayoutQuestionArea;

  /** Chế độ PAGED: hiện từng câu/nhóm kiểu TOEIC (nghe tự chuyển, đọc bấm) */
  isPaged?: boolean;
  flowSteps?: ExamFlowStep[];
  currentStepIndex?: number;
  canGoPrev?: boolean;
  goNext?: () => void;
  goPrev?: () => void;
};

function QuestionAreaBlock({
  isPractice,
  visibleParts,
  questionIndexMap,
  userAnswers,
  handleAnswerChange,
  config,

  isPaged = false,
  flowSteps = [],
  currentStepIndex = 0,
  canGoPrev = false,
  goNext,
  goPrev,
}: QuestionAreaBlockProps) {

  const pagedRootRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    if (!isPaged) return;
    let p = pagedRootRef.current?.parentElement;
    while (p) {
      if (p.scrollHeight > p.clientHeight && p.scrollTop > 0) {
        p.scrollTop = 0;
        break;
      }
      p = p.parentElement;
    }
  }, [isPaged, currentStepIndex]);

  const useSide = (config?.passagePosition ?? 'side') === 'side';
  const hasPassageContent = (passage: ExamPassage) =>
    mediaListOf(passage).length > 0 || Boolean(passage?.content || passage?.mediaUrl);

  const renderPassageText = (text: string | null | undefined, key: string) => (
    <div key={key} className={cx('passage-content')}>
      {String(text)
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((para, i) => (
          <p key={i} className={cx('passage-paragraph')}>
            {para}
          </p>
        ))}
    </div>
  );

  const renderPassage = (passage: ExamPassage, opts: { suppressAudio?: boolean } = {}) => {
    const suppressAudio = opts.suppressAudio === true;
    const content = passage?.content;
    const mediaList = mediaListOf(passage);
    const hasMediaList = mediaList.length > 0;
    const singleMediaUrl = passage?.mediaUrl;

    const hasContent = !!content;
    const hasAnyMedia = hasMediaList || !!singleMediaUrl;
    const hasNonAudioMedia =
      hasMediaList && mediaList.some((m) => m?.mediaType !== MediaType.AUDIO);

    if (suppressAudio ? !hasContent && !hasNonAudioMedia : !hasContent && !hasAnyMedia) return null;

    return (
      <div className={cx('passage-box')}>

        {content && renderPassageText(content, 'main')}

        {hasMediaList &&
          mediaList.map((m, idx) => {
            const type = m.mediaType;
            if (type === MediaType.TEXT) {
              return m.content ? renderPassageText(m.content, `media-${idx}`) : null;
            }
            const url = m.mediaUrl;
            if (!url) return null;
            if (type === MediaType.AUDIO) {
              if (suppressAudio) return null;
              return (
                <div key={idx} className="mb-3">
                  <audio
                    controls
                    src={getFullMediaUrl(url) ?? undefined}
                    className={cx('audio-player')}
                  />
                </div>
              );
            }
            if (type === MediaType.IMAGE) {
              return (
                <div key={idx} className={cx('passage-image-box')}>
                  <img
                    src={getFullMediaUrl(url) ?? undefined}
                    alt={`Passage ${idx + 1}`}
                    className={cx('passage-image')}
                  />
                </div>
              );
            }
            return null;
          })}
        {!suppressAudio && !hasMediaList && singleMediaUrl && isListening(passage) && (
            <div className="mb-4">
              <audio
                controls
                src={getFullMediaUrl(singleMediaUrl) ?? undefined}
                className={cx('audio-player')}
              />
            </div>
          )}
      </div>
    );
  };

  const renderQuestionOnly = (q: ExamQuestion, absoluteIndex: number) => {
    return (
      <div key={q.questionId} id={`q-${q.questionId}`} className={cx('question-card')}>
        <span className={cx('q-text')}>
          <span className={cx('q-number')}>Câu {absoluteIndex}:</span>
          {q.questionText}
        </span>

        {q.questionType === QuestionType.MCQ && (
          <div className={cx('mcq-group')}>
            {q.answers?.map((a) => (
              <div
                key={a.answerId}
                className={cx('mcq-option', {
                  selected: userAnswers[q.questionId]?.selectedAnswerId === a.answerId,
                })}
                onClick={() => handleAnswerChange(q.questionId, 'MCQ', a.answerId)}
              >
                <Form.Check
                  type="radio"
                  name={`q-${q.questionId}`}
                  checked={userAnswers[q.questionId]?.selectedAnswerId === a.answerId}
                  readOnly
                />
                <span>
                  {a.answerText?.trim()
                    ? `${a.answerLabel}. ${a.answerText}`
                    : a.answerLabel}
                </span>
              </div>
            ))}
          </div>
        )}

        {q.questionType === QuestionType.MSQ && (
          <div className={cx('mcq-group')}>
            {q.answers?.map((a) => {
              const chosen = (userAnswers[q.questionId]?.selectedAnswerIds || []).includes(
                a.answerId,
              );
              return (
                <div
                  key={a.answerId}
                  className={cx('mcq-option', { selected: chosen })}
                  onClick={() => handleAnswerChange(q.questionId, 'MSQ', a.answerId)}
                >
                  <Form.Check type="checkbox" checked={chosen} readOnly />
                  <span>
                    {a.answerText?.trim() ? `${a.answerLabel}. ${a.answerText}` : a.answerLabel}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {q.questionType === QuestionType.FILL_BLANK && (
          <input
            type="text"
            className={cx('fill-input')}
            value={userAnswers[q.questionId]?.answerText || ''}
            onChange={(e) => handleAnswerChange(q.questionId, 'FILL_BLANK', e.target.value)}
            placeholder="Nhập câu trả lời của bạn..."
          />
        )}

        {q.questionType === QuestionType.ESSAY && (
          <textarea
            className={cx('essay-input')}
            value={userAnswers[q.questionId]?.answerText || ''}
            onChange={(e) => handleAnswerChange(q.questionId, 'ESSAY', e.target.value)}
            placeholder="Viết câu trả lời chi tiết tại đây..."
          />
        )}
      </div>
    );
  };

  const renderQuestionCard = (q: ExamQuestion, absoluteIndex: number) => {
    const hasPassage = hasPassageContent(q.passage);
    const split = hasPassage && useSide;
    const questionCard = renderQuestionOnly(q, absoluteIndex);

    return (
      <div
        key={q.questionId}
        id={`q-${q.questionId}`}
        className={cx('question-card-wrapper', {
          'split-layout': split,
        })}
      >
        {split ? (
          <>
            <div className={cx('passage-column')} aria-label="Đọc tài liệu">
              {renderPassage(q.passage)}
            </div>
            <div className={cx('question-column')}>{questionCard}</div>
          </>
        ) : (
          <>
            {renderPassage(q.passage)}
            {questionCard}
          </>
        )}
      </div>
    );
  };

  if (isPaged) {
    const step = flowSteps[currentStepIndex];
    if (!step) {
      return <div className={cx('paged-empty')}>Đang tải câu hỏi…</div>;
    }

    const passage = step.passage;
    const audioUrls = step.audioGated ? getAudioUrls(passage) : [];
    const gated = step.audioGated && audioUrls.length > 0;
    const isLast = currentStepIndex >= flowSteps.length - 1;
    const showManualNext = !gated && !isLast;

    const passageText = String(passage?.content ?? '').trim();
    const hasNonAudioMedia = mediaListOf(passage).some((m) => m?.mediaType !== MediaType.AUDIO);
    const passageContentToShow = gated
      ? Boolean(passageText) || hasNonAudioMedia
      : hasPassageContent(passage);

    const split = passageContentToShow && useSide;

    const questionsNode = step.questions.map((q) =>
      renderQuestionOnly(q, questionIndexMap[q.questionId]),
    );

    return (
      <div ref={pagedRootRef} className={cx('paged-root', { 'paged-fit': split })}>

        {gated && <GatedAudioPlayer key={step.key} urls={audioUrls} onCompleted={goNext} />}

        <div key={currentStepIndex} className={cx('paged-body', { 'split-layout': split })}>
          {split ? (
            <>
              <div className={cx('passage-column')} aria-label="Tài liệu / audio">
                {renderPassage(passage, { suppressAudio: gated })}
              </div>
              <div className={cx('question-column')}>
                <div className={cx('questions-frame')}>{questionsNode}</div>
              </div>
            </>
          ) : (
            <>
              {renderPassage(passage, { suppressAudio: gated })}
              {questionsNode}
            </>
          )}
        </div>

        {!gated && (canGoPrev || !isLast) && (
          <div className={cx('paged-nav')}>
            <div className={cx('paged-nav-left')}>
              {canGoPrev && (
                <ButtonPrime variant="outline" onClick={goPrev}>
                  Câu trước
                </ButtonPrime>
              )}
            </div>
            <div className={cx('paged-nav-right')}>
              {showManualNext && (
                <ButtonPrime variant="primary" onClick={goNext}>
                  Câu tiếp
                </ButtonPrime>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {isPractice && <h1 className={cx('exam-title')}>Luyện tập theo Part</h1>}

      {visibleParts.map((part) => (
        <div key={part.testPartId} className={cx('part-section')}>
          <div className={cx('questions-list')}>
            {part.questionGroups?.map((group, groupIdx) => {
              const hasPassage = hasPassageContent(group.passage);
              const split = hasPassage && useSide;
              return (
                <div
                  key={group.passage?.passageId || groupIdx}
                  className={cx('group-section', { 'split-layout': split })}
                >
                  {split ? (
                    <>
                      <div className={cx('passage-column')} aria-label="Đọc tài liệu">
                        {renderPassage(group.passage)}
                      </div>
                      <div className={cx('question-column')}>
                        <div className={cx('questions-frame')}>
                          {group.questions?.map((q) =>
                            renderQuestionOnly(q, questionIndexMap[q.questionId]),
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {renderPassage(group.passage)}
                      {group.questions?.map((q) =>
                        renderQuestionCard(q, questionIndexMap[q.questionId]),
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

export default QuestionAreaBlock;
