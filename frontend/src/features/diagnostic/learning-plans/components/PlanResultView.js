import { useMemo } from 'react';
import classNames from 'classnames/bind';
import styles from '~/features/diagnostic/styles/PersonalizedPlan.module.scss';
import ReviewQuestionCard from '~/shared/ui/Review/ReviewQuestionCard';
import ReviewFooterNav from '~/shared/ui/Review/ReviewFooterNav';

const cx = classNames.bind(styles);

function selectedIdsOf(item) {
  if (item.questionType === 'MSQ') return item.selectedAnswerIds || [];
  return item.selectedAnswerId ? [item.selectedAnswerId] : [];
}

function itemStatus(item) {
  if (selectedIdsOf(item).length === 0) return 'unanswered';
  return item.correct ? 'correct' : 'incorrect';
}

/**
 * Màn giải thích / xem lại ải — dùng chung thẻ câu hỏi + footer với trang review thi.
 */
function PlanResultView({ result, onRetry, onPickAnother }) {
  const items = useMemo(
    () =>
      (result?.reviewItems || []).map((item, idx) => ({
        ...item,
        id: item.questionId,
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
    <div className={cx('planReviewWithFooter')}>
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
          {items.map((item) => (
            <ReviewQuestionCard
              key={item.questionId}
              id={`pr-${item.questionId}`}
              number={item.number}
              status={item.status}
              questionText={item.questionText}
              answers={item.answers || []}
              selectedAnswerIds={selectedIdsOf(item)}
              correctAnswerId={item.correctAnswerId}
              explanation={item.explanation}
            />
          ))}
        </div>
      )}

      <ReviewFooterNav
        items={items}
        correctCount={correctCount}
        onSelect={scrollToQuestion}
      />
    </div>
  );
}

export default PlanResultView;
