import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Container, Spinner, Form, Row, Col } from 'react-bootstrap';
import classNames from 'classnames/bind';
import {
  IoSendOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoListOutline,
  IoCloseOutline,
} from 'react-icons/io5';

import { getFullMediaUrl } from '~/utils/mediaUrl';
import TestStartDashboard from './TestStartDashboard';
import TestStateScreens from './TestStateScreens';
import { useTestSession } from './useTestSession';
import styles from './TestStartPage.module.scss';

const cx = classNames.bind(styles);

// Các trạng thái không phải "đang làm bài" -> hiển thị màn riêng thay vì render đề.
const STATE_SCREEN_STATUSES = ['loading', 'payment', 'no-attempts', 'locked', 'closed'];

function TestStartPage() {
  const navigate = useNavigate();
  const {
    isPractice,
    status,
    test,
    userAnswers,
    timeLeft,
    preCountdown,
    isSubmitting,
    purchasing,
    balance,
    visibleParts,
    allQuestions,
    questionIndexMap,
    handleAnswerChange,
    handleSubmit,
    handlePurchase,
  } = useTestSession();

  const [showInfoPanel, setShowInfoPanel] = useState(false);

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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

  // Tách text passage theo dòng -> mỗi đoạn là 1 <p> để có khoảng cách giữa các đoạn
  // (parser import nối các đoạn bằng "\n" đơn nên nếu không tách sẽ nhìn dính 1 khối).
  const renderPassageText = (text, key) => (
    <div key={key} className={cx('passage-content')}>
      {String(text)
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((para, i) => (
          <p key={i} className={cx('passage-paragraph')}>{para}</p>
        ))}
    </div>
  );

  const renderPassage = (passage, fallbackObj) => {
    const content =
      passage?.content ??
      passage?.passage_content ??
      fallbackObj?.content ??
      fallbackObj?.passage_content;
    const pType = passage?.passageType ?? passage?.passage_type ?? 'READING';

    // Bảng trung gian passage_media: passage có danh sách media (nhiều audio/ảnh)
    const mediaList =
      passage?.passageMediaList ??
      passage?.passageMedias ??
      passage?.mediaList ??
      passage?.passage_media ??
      [];
    const hasMediaList = Array.isArray(mediaList) && mediaList.length > 0;

    // Backward compat: một media trực tiếp trên passage (cũ)
    const singleMediaUrl =
      passage?.mediaUrl ??
      passage?.media_url ??
      fallbackObj?.mediaUrl ??
      fallbackObj?.media_url ??
      fallbackObj?.audioUrl ??
      fallbackObj?.audio_url ??
      fallbackObj?.passageMediaUrl;

    // Các đoạn text bổ sung (passage nhiều đoạn) lưu trong passage_media type=TEXT.
    const audioTotal = hasMediaList
      ? mediaList.filter((x) => (x.mediaType ?? x.media_type ?? '').toUpperCase() === 'AUDIO').length
      : 0;

    const hasContent = !!content;
    const hasAnyMedia = hasMediaList || !!singleMediaUrl;
    if (!hasContent && !hasAnyMedia) return null;

    return (
      <div className={cx('passage-box')}>
        {/* Render theo ĐÚNG THỨ TỰ thêm: đoạn chính (content) trước, rồi từng item
            trong passage_media (text / ảnh / audio) theo thứ tự id. */}
        {content && renderPassageText(content, 'main')}

        {/* KHÔNG hiển thị bản dịch trong lúc làm bài — chỉ có ở trang xem đáp án. */}

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
        {!hasMediaList &&
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
              const chosen = (userAnswers[q.questionId]?.selectedAnswerIds || []).includes(a.answerId);
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
    const questionCard = renderQuestionOnly(q, absoluteIndex);

    return (
      <div
        key={q.questionId}
        id={`q-${q.questionId}`}
        className={cx('question-card-wrapper', {
          'split-layout': hasPassage,
        })}
      >
        {hasPassage ? (
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

  const scrollToQuestion = (questionId) => {
    const element = document.getElementById(`q-${questionId}`);
    if (element) {
      const offset = 80; // Header height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  if (STATE_SCREEN_STATUSES.includes(status)) {
    return (
      <TestStateScreens
        status={status}
        test={test}
        balance={balance}
        purchasing={purchasing}
        preCountdown={preCountdown}
        formatTime={formatTime}
        onBack={() => navigate(-1)}
        onPurchase={handlePurchase}
      />
    );
  }

  return (
    <div className={cx('wrapper')}>
      <Container fluid className={cx('content')}>
        <h1>{isPractice ? 'Luyện tập theo Part' : 'Bài thi'}</h1>

        <Row>
          <Col xs={12}>
            {visibleParts.map((part, i) => (
              <div key={part.testPartId} className={cx('part-section')}>
                <div className={cx('questions-list')}>
                  {/* Render question groups */}
                  {part.questionGroups?.map((group, groupIdx) => {
                    const hasPassage = hasPassageContent(group.passage);
                    return (
                      <div
                        key={group.passage?.passageId || groupIdx}
                        className={cx('group-section', { 'split-layout': hasPassage })}
                      >
                        {hasPassage ? (
                          <>
                            <div className={cx('passage-column')} aria-label="Đọc tài liệu">
                              {renderPassage(group.passage)}
                            </div>
                            <div className={cx('question-column')}>
                              <div className={cx('questions-frame')}>
                                {group.questions?.map((q) => {
                                  return renderQuestionOnly(q, questionIndexMap[q.questionId]);
                                })}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            {renderPassage(group.passage)}
                            {group.questions?.map((q) => {
                              return renderQuestionCard(q, questionIndexMap[q.questionId]);
                            })}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </Col>
        </Row>
      </Container>

      {createPortal(
        <div className={cx('footer-actions')}>
          {showInfoPanel && (
            <div className={cx('footer-panel')}>
              <TestStartDashboard
                allQuestions={allQuestions}
                userAnswers={userAnswers}
                onScrollToQuestion={(id) => {
                  scrollToQuestion(id);
                  setShowInfoPanel(false);
                }}
              />
            </div>
          )}
          <div className={cx('footer-buttons')}>
            <Container className={cx('footer-buttons-inner')}>
              <button
                type="button"
                className={cx('btn-toggle-info', { active: showInfoPanel })}
                onClick={() => setShowInfoPanel((v) => !v)}
                aria-expanded={showInfoPanel}
                aria-label={
                  showInfoPanel
                    ? 'Ẩn danh sách câu hỏi'
                    : 'Xem danh sách câu hỏi'
                }
              >
                {showInfoPanel ? (
                  <IoCloseOutline size={22} />
                ) : (
                  <IoListOutline size={22} />
                )}
                <span>{showInfoPanel ? 'Ẩn' : 'Câu hỏi'}</span>
              </button>
              <div className={cx('footer-right-group')}>
                <div className={cx('footer-pills')}>
                  {timeLeft !== null && (
                    <div className={cx('exam-stat', 'exam-stat-time')}>
                      <IoTimeOutline aria-hidden />
                      <span className={cx('exam-stat-value')}>{formatTime(timeLeft)}</span>
                    </div>
                  )}
                  <div className={cx('exam-stat', 'exam-stat-done')}>
                    <IoCheckmarkCircleOutline aria-hidden />
                    <span className={cx('exam-stat-value')}>
                      {Object.keys(userAnswers).length}/{allQuestions.length}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className={cx('btn-submit')}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <IoSendOutline />
                  )}
                  {isSubmitting ? 'Đang nộp bài...' : 'Nộp bài thi'}
                </button>
              </div>
            </Container>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

export default TestStartPage;
