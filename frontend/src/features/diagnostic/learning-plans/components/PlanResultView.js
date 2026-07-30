import { useMemo, useState } from 'react';
import { Container } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { IoCheckmarkCircleOutline, IoCloseOutline, IoListOutline } from 'react-icons/io5';
import styles from '~/features/diagnostic/styles/PersonalizedPlan.module.scss';
import reviewStyles from '~/features/tests/exam/exam-types/detail/result/TestReviewPage.module.scss';

const cx = classNames.bind(styles);
const rx = classNames.bind(reviewStyles);

function itemStatus(item) {
  const isMsq = item.questionType === 'MSQ';
  const userSelectedIds = isMsq
    ? item.selectedAnswerIds || []
    : item.selectedAnswerId
      ? [item.selectedAnswerId]
      : [];
  if (userSelectedIds.length === 0) return 'unanswered';
  return item.correct ? 'correct' : 'incorrect';
}

/**
 * Màn giải thích / xem lại ải — dùng cùng footer danh sách câu như trang review thi.
 */
function PlanResultView({ result, onRetry, onPickAnother }) {
  const [showNav, setShowNav] = useState(false);

  const items = useMemo(
    () =>
      (result?.reviewItems || []).map((item, idx) => ({
        ...item,
        number: idx + 1,
        status: itemStatus(item),
      })),
    [result?.reviewItems],
  );

  const correctCount = useMemo(
    () => items.filter((i) => i.status === 'correct').length,
    [items],
  );

  const scrollToQuestion = (questionId) => {
    const el = document.getElementById(`pr-${questionId}`);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - 90;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  if (!result) return null;

  return (
    <div className={cx('planReview', 'planReviewWithFooter')}>
      <div className={cx('planReviewTop')}>
        <div>
          <h2 className={cx('reviewTitle')}>Chi tiết bài làm</h2>
          <p className={cx('planReviewMeta')}>
            <span
              className={cx('planReviewStatus', {
                passed: result.passed,
                failed: !result.passed,
              })}
            >
              {result.passed ? 'Đã qua ải' : 'Chưa qua ải'}
            </span>
            <span>
              {correctCount}/{items.length} câu đúng
              {result.accuracy != null ? ` · ${result.accuracy}%` : ''}
            </span>
          </p>
        </div>
        <div className={cx('resultActions')}>
          <button type="button" className={cx('btn', 'btnPrimary', 'btnSm')} onClick={onRetry}>
            {result.passed ? 'Làm lại ải này' : 'Thử lại'}
          </button>
          <button
            type="button"
            className={cx('btn', 'btnOutline', 'btnSm')}
            onClick={onPickAnother}
          >
            Chọn ải khác
          </button>
        </div>
      </div>

      {items.length > 0 && (
        <div className={cx('reviewPanel')}>
          {items.map((item) => {
            const isMsq = item.questionType === 'MSQ';
            const userSelectedIds = isMsq
              ? item.selectedAnswerIds || []
              : item.selectedAnswerId
                ? [item.selectedAnswerId]
                : [];
            return (
              <div
                key={item.questionId}
                id={`pr-${item.questionId}`}
                className={cx('questionItem', item.status)}
              >
                <span className={cx('qText')}>
                  <strong>Câu {item.number}:</strong> {item.questionText}
                </span>
                <div className={cx('answersOptions')}>
                  {(item.answers || []).map((a) => {
                    const isCorrectAnswer =
                      a.isCorrect != null
                        ? a.isCorrect
                        : a.answerId === item.correctAnswerId;
                    const isUserChoice = userSelectedIds.includes(a.answerId);
                    return (
                      <div
                        key={a.answerId}
                        className={cx('answerOption', {
                          isCorrect: isCorrectAnswer,
                          isIncorrectChoice: isUserChoice && !isCorrectAnswer,
                          isUserChoice,
                        })}
                      >
                        {a.answerText?.trim()
                          ? `${a.answerLabel ? `${a.answerLabel}. ` : ''}${a.answerText}`
                          : a.answerLabel}
                        {isUserChoice && (
                          <span className={cx('userPill')}>(Bạn chọn)</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {item.explanation?.trim() && (
                  <div className={cx('explanationBox')}>
                    <strong>Giải thích:</strong> {item.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {items.length > 0 && (
        <div className={rx('footer-actions')}>
          {showNav && (
            <div className={rx('footer-panel')}>
              <div className={rx('nav-card')}>
                <div className={rx('nav-header')}>
                  <IoListOutline />
                  <span>Danh sách câu hỏi</span>
                </div>
                <div className={rx('nav-grid')}>
                  {items.map((item) => (
                    <button
                      key={item.questionId}
                      type="button"
                      className={rx('nav-item', item.status)}
                      onClick={() => {
                        scrollToQuestion(item.questionId);
                        setShowNav(false);
                      }}
                      aria-label={`Câu ${item.number}`}
                    >
                      {item.number}
                    </button>
                  ))}
                </div>
                <div className={rx('nav-legend')}>
                  <span className={rx('legend-item')}>
                    <span className={rx('dot', 'correct')} /> Đúng
                  </span>
                  <span className={rx('legend-item')}>
                    <span className={rx('dot', 'incorrect')} /> Sai
                  </span>
                  <span className={rx('legend-item')}>
                    <span className={rx('dot', 'unanswered')} /> Chưa làm
                  </span>
                </div>
              </div>
            </div>
          )}
          <div className={rx('footer-buttons')}>
            <Container className={rx('footer-buttons-inner')}>
              <button
                type="button"
                className={rx('btn-toggle-info', { active: showNav })}
                onClick={() => setShowNav((v) => !v)}
                aria-expanded={showNav}
              >
                {showNav ? <IoCloseOutline size={22} /> : <IoListOutline size={22} />}
                <span>{showNav ? 'Ẩn' : 'Danh sách câu'}</span>
              </button>
              <div className={rx('footer-score')}>
                <IoCheckmarkCircleOutline aria-hidden />
                <span>
                  {correctCount}/{items.length} câu đúng
                </span>
              </div>
            </Container>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlanResultView;
