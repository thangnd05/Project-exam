import { useLayoutEffect, useRef } from 'react';
import { Form } from 'react-bootstrap';
import classNames from 'classnames/bind';

import { getFullMediaUrl } from '~/shared/utils/mediaUrl';
import ButtonPrime from '~/shared/ui/Button/ButtonPrime';
import GatedAudioPlayer from './GatedAudioPlayer';
import styles from '../../TestStartPage.module.scss';

const cx = classNames.bind(styles);

// Trích danh sách URL audio của 1 passage (theo thứ tự) để feed GatedAudioPlayer ở chế độ paged.
const getAudioUrls = (passage) => {
  const list =
    passage?.passageMedias ?? passage?.passageMediaList ?? passage?.mediaList ?? passage?.passage_media ?? [];
  const urls = [];
  if (Array.isArray(list)) {
    list.forEach((m) => {
      if ((m?.mediaType ?? m?.media_type ?? '').toUpperCase() === 'AUDIO') {
        const u = m?.mediaUrl ?? m?.media_url;
        if (u) urls.push(u);
      }
    });
  }
  if (urls.length === 0) {
    const single = passage?.mediaUrl ?? passage?.media_url;
    const pType = (passage?.passageType ?? passage?.passage_type ?? '').toUpperCase();
    if (single && pType === 'LISTENING') urls.push(single);
  }
  return urls;
};

function QuestionAreaBlock({
  isPractice,
  visibleParts,
  questionIndexMap,
  userAnswers,
  handleAnswerChange,
  config,
  // Paged (TOEIC-style) — chỉ dùng khi isPaged=true
  isPaged = false,
  flowSteps = [],
  currentStepIndex = 0,
  canGoPrev = false,
  goNext,
  goPrev,
}) {
  // Paged: mỗi lần đổi bước, reset vùng cuộn bao ngoài (centerScroll) về đầu.
  // 2 khung cuộn bên trong (passage-box, questions-frame) được reset qua key ở paged-body.
  const pagedRootRef = useRef(null);
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

  const renderPassage = (passage, fallbackObj, opts = {}) => {
    const suppressAudio = opts.suppressAudio === true;
    const content =
      passage?.content ??
      passage?.passage_content ??
      fallbackObj?.content ??
      fallbackObj?.passage_content;
    const pType = passage?.passageType ?? passage?.passage_type ?? 'READING';

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
    const hasNonAudioMedia =
      hasMediaList &&
      mediaList.some((m) => (m?.mediaType ?? m?.media_type ?? '').toUpperCase() !== 'AUDIO');
    // Khi suppressAudio (paged listening) mà passage chỉ có audio -> không render box rỗng.
    if (suppressAudio ? !hasContent && !hasNonAudioMedia : !hasContent && !hasAnyMedia) return null;

    return (
      <div className={cx('passage-box')}>

        {content && renderPassageText(content, 'main')}

        {hasMediaList &&
          mediaList.map((m, idx) => {
            const type = (m.mediaType ?? m.media_type ?? '').toUpperCase();
            if (type === 'TEXT') {
              const t = m.content ?? m.content_text;
              return t ? renderPassageText(t, `media-${idx}`) : null;
            }
            const url = m.mediaUrl ?? m.media_url;
            if (!url) return null;
            if (type === 'AUDIO') {
              if (suppressAudio) return null; // paged listening: audio do GatedAudioPlayer đảm nhiệm
              return (
                <div key={idx} className="mb-3">
                  <audio
                    controls
                    src={getFullMediaUrl(url)}
                    className={cx('audio-player')}
                  />
                </div>
              );
            }
            if (type === 'IMAGE') {
              return (
                <div key={idx} className={cx('passage-image-box')}>
                  <img
                    src={getFullMediaUrl(url)}
                    alt={`Passage ${idx + 1}`}
                    className={cx('passage-image')}
                  />
                </div>
              );
            }
            return null;
          })}
        {!suppressAudio &&
          !hasMediaList &&
          singleMediaUrl &&
          (pType === 'LISTENING' || pType === 'listening') && (
            <div className="mb-4">
              <audio
                controls
                src={getFullMediaUrl(singleMediaUrl)}
                className={cx('audio-player')}
              />
            </div>
          )}
      </div>
    );
  };

  const renderQuestionOnly = (q, absoluteIndex) => {
    return (
      <div key={q.questionId} id={`q-${q.questionId}`} className={cx('question-card')}>
        <span className={cx('q-text')}>
          <span className={cx('q-number')}>Câu {absoluteIndex}:</span>
          {q.questionText}
        </span>

        {q.questionType === 'MCQ' && (
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

        {q.questionType === 'MSQ' && (
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

        {q.questionType === 'FILL_BLANK' && (
          <input
            type="text"
            className={cx('fill-input')}
            value={userAnswers[q.questionId]?.answerText || ''}
            onChange={(e) => handleAnswerChange(q.questionId, 'FILL_BLANK', e.target.value)}
            placeholder="Nhập câu trả lời của bạn..."
          />
        )}

        {q.questionType === 'ESSAY' && (
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

  const renderQuestionCard = (q, absoluteIndex) => {
    const hasPassage = hasPassageContent(q.passage, q);
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
              {renderPassage(q.passage, q)}
            </div>
            <div className={cx('question-column')}>{questionCard}</div>
          </>
        ) : (
          <>
            {renderPassage(q.passage, q)}
            {questionCard}
          </>
        )}
      </div>
    );
  };

  // ===== Chế độ PAGED (từng bước, kiểu TOEIC) =====
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

    // Có gì để hiện ở cột trái ngoài audio không? (text/ảnh) — audio đã do GatedAudioPlayer lo.
    // Lưu ý: content của passage nghe thường là chuỗi rỗng '' nên phải trim, KHÔNG dùng ?? (nuốt '').
    const passageText = String(passage?.content ?? passage?.passage_content ?? '').trim();
    const mediaItems =
      passage?.passageMediaList ??
      passage?.passageMedias ??
      passage?.mediaList ??
      passage?.passage_media ??
      [];
    const hasNonAudioMedia =
      Array.isArray(mediaItems) &&
      mediaItems.some((m) => (m?.mediaType ?? m?.media_type ?? '').toUpperCase() !== 'AUDIO');
    const passageContentToShow = gated
      ? Boolean(passageText) || hasNonAudioMedia
      : hasPassageContent(passage);
    // Phần nghe cũng chia 2 cột (audio + ảnh bên trái, câu hỏi bên phải), không dồn dọc.
    const split = passageContentToShow && useSide;

    const questionsNode = step.questions.map((q) =>
      renderQuestionOnly(q, questionIndexMap[q.questionId]),
    );

    return (
      <div ref={pagedRootRef} className={cx('paged-root', { 'paged-fit': split })}>
        {/* Player nghe: full chiều ngang, tách khỏi layout 2 cột; box chỉ hiện khi audio bị dừng. */}
        {gated && <GatedAudioPlayer key={step.key} urls={audioUrls} onCompleted={goNext} />}

        <div key={currentStepIndex} className={cx('paged-body', { 'split-layout': split })}>
          {split ? (
            <>
              <div className={cx('passage-column')} aria-label="Tài liệu / audio">
                {renderPassage(passage, null, { suppressAudio: gated })}
              </div>
              <div className={cx('question-column')}>
                <div className={cx('questions-frame')}>{questionsNode}</div>
              </div>
            </>
          ) : (
            <>
              {renderPassage(passage, null, { suppressAudio: gated })}
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
      <h1 className={cx('exam-title')}>{isPractice ? 'Luyện tập theo Part' : 'Bài thi'}</h1>

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
