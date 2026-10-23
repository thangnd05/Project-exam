'use client';

import { useLayoutEffect, useRef } from 'react';
import { Form } from 'react-bootstrap';
import { IoArrowBack, IoArrowForward, IoFlag, IoFlagOutline } from 'react-icons/io5';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';

import { getFullMediaUrl } from '@/app/utils/mediaUrl';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import GatedAudioPlayer from '@/app/features/exam-layout/blocks/GatedAudioPlayer';
import { MediaType, PassageType, QuestionType } from '@/app/enums';
import type { AnswerResponse, PassageMediaResponse } from '@/app/types';
import type {
  AnswerChangeHandler,
  ExamFlowStep,
  ExamPart,
  ExamPassage,
  ExamQuestion,
  ExamUserAnswers,
  QuestionIndexMap,
} from '@/app/features/exam-layout/examLayoutTypes';
import type { LayoutQuestionArea } from '@/app/features/exam-layout/layoutSchema';
import styles from '@/app/features/exam-layout/TestStart.module.scss';
import MediaImage from '@/app/components/MediaImage/MediaImage';

const cx = classNames.bind(styles);

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
  flaggedQuestionIds?: string[];
  onToggleFlag?: (questionId: string) => void;
  config?: LayoutQuestionArea;

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
  flaggedQuestionIds,
  onToggleFlag,
  config,

  isPaged = false,
  flowSteps = [],
  currentStepIndex = 0,
  canGoPrev = false,
  goNext,
  goPrev,
}: QuestionAreaBlockProps) {
  const t = useTranslations('TestTaking.examLayout');

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
                  <MediaImage
                    src={getFullMediaUrl(url)}
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

  const renderOptionContent = (a: AnswerResponse) =>
    a.answerText?.trim() ? (
      <>
        <span className={cx('opt-label')}>{a.answerLabel}.</span>
        <span className={cx('opt-text')}>{a.answerText}</span>
      </>
    ) : (
      <span className={cx('opt-label')}>{a.answerLabel}</span>
    );

  // Đáp án chỉ có nhãn (A/B/C/D, kiểu nghe TOEIC) thì xếp ngang cho gọn; có nội dung thì xếp 1 cột.
  const isLabelOnly = (q: ExamQuestion) =>
    (q.answers?.length ?? 0) > 0 && q.answers!.every((a) => !a.answerText?.trim());

  const renderQuestionOnly = (q: ExamQuestion, absoluteIndex: number) => {
    const flagged = flaggedQuestionIds?.includes(q.questionId) ?? false;
    return (
      <div key={q.questionId} id={`q-${q.questionId}`} className={cx('question-card')}>
        <div className={cx('q-head')}>
          <span className={cx('q-text')}>
            <span className={cx('q-number')}>{t('questionNumber', { number: absoluteIndex })}</span>
            {q.questionText}
          </span>
          {onToggleFlag && (
            <button
              type="button"
              className={cx('q-flag-btn', { active: flagged })}
              onClick={() => onToggleFlag(q.questionId)}
              aria-pressed={flagged}
              title={flagged ? t('unflag') : t('flagForReview')}
            >
              {flagged ? <IoFlag size={16} /> : <IoFlagOutline size={16} />}
              <span>{flagged ? t('flagged') : t('flag')}</span>
            </button>
          )}
        </div>

        {q.questionType === QuestionType.MCQ && (
          <div className={cx('mcq-group', { 'label-only': isLabelOnly(q) })}>
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
                {renderOptionContent(a)}
              </div>
            ))}
          </div>
        )}

        {q.questionType === QuestionType.MSQ && (
          <div className={cx('mcq-group', { 'label-only': isLabelOnly(q) })}>
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
                  {renderOptionContent(a)}
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
            placeholder={t('fillPlaceholder')}
          />
        )}

        {q.questionType === QuestionType.ESSAY && (
          <textarea
            className={cx('essay-input')}
            value={userAnswers[q.questionId]?.answerText || ''}
            onChange={(e) => handleAnswerChange(q.questionId, 'ESSAY', e.target.value)}
            placeholder={t('essayPlaceholder')}
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
            <div className={cx('passage-column')} aria-label={t('readingMaterial')}>
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
      return <div className={cx('paged-empty')}>{t('loadingQuestions')}</div>;
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
              <div className={cx('passage-column')} aria-label={t('materialAudio')}>
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

        {!gated && flowSteps.length > 1 && (
          <div className={cx('paged-nav')}>
            <div className={cx('paged-nav-left')}>
              <ButtonPrime variant="outline" onClick={goPrev} disabled={!canGoPrev}>
                <IoArrowBack aria-hidden />
                {t('prev')}
              </ButtonPrime>
            </div>
            <div className={cx('paged-nav-right')}>
              {showManualNext && (
                <ButtonPrime variant="primary" onClick={goNext}>
                  {t('next')}
                  <IoArrowForward aria-hidden />
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
      {isPractice && <h1 className={cx('exam-title')}>{t('practiceTitle')}</h1>}

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
                      <div className={cx('passage-column')} aria-label={t('readingMaterial')}>
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
