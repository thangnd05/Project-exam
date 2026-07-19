import classNames from 'classnames/bind';
import styles from '~/features/diagnostic/styles/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

/**
 * Màn kết quả một ải (dùng chung): vòng tròn %, badge qua/chưa qua, và phần
 * xem lại đáp án + giải thích. Chỉ trình bày — mọi hành động do trang cha truyền vào.
 */
function PlanResultView({
  result,
  showReview,
  onToggleReview,
  onRetry,
  onPickAnother,
}) {
  if (!result) return null;

  return (
    <>
      <div className={cx('resultCard', { passed: result.passed, failed: !result.passed })}>
        <div className={cx('resultRing')} style={{ '--pct': result.accuracy || 0 }}>
          <div className={cx('resultRingInner')}>
            <span className={cx('resultPct')}>{result.accuracy}%</span>
            {(result.correctCount > 0 || result.totalCount > 0) && (
              <span className={cx('resultFraction')}>
                {result.correctCount}/{result.totalCount} đúng
              </span>
            )}
          </div>
        </div>

        <div className={cx('resultBody')}>
          <div className={cx('resultBadge')}>
            {result.passed ? '🎉 Đã qua ải!' : '📚 Chưa qua ải'}
          </div>
          <p className={cx('resultMessage')}>{result.message}</p>
          <div className={cx('resultActions')}>
            <button
              type="button"
              className={cx('btn', 'btnPrimary', 'btnSm')}
              onClick={onToggleReview}
            >
              {showReview ? 'Ẩn đáp án' : 'Xem đáp án & giải thích'}
            </button>
            <button
              type="button"
              className={cx('btn', 'btnOutline', 'btnSm')}
              onClick={onRetry}
            >
              {result.passed ? 'Làm lại ải này' : 'Thử lại'}
            </button>
            <button
              type="button"
              className={cx('btn', 'btnGhost', 'btnSm')}
              onClick={onPickAnother}
            >
              Chọn ải khác
            </button>
          </div>
        </div>
      </div>

      {showReview && result.reviewItems?.length > 0 && (
        <div className={cx('reviewSection')}>
          {result.reviewItems.map((item, idx) => {
            const isMsq = item.questionType === 'MSQ';
            const userSelectedIds = isMsq
              ? (item.selectedAnswerIds || [])
              : (item.selectedAnswerId ? [item.selectedAnswerId] : []);
            return (
              <div
                key={item.questionId}
                className={cx('reviewItem', {
                  reviewCorrect: item.correct,
                  reviewWrong: !item.correct,
                })}
              >
                <div className={cx('reviewQuestionNo')}>
                  Câu {idx + 1} {item.correct ? '✓' : '✗'}
                </div>
                <div className={cx('reviewQuestionText')}>{item.questionText}</div>
                <div className={cx('reviewAnswerList')}>
                  {(item.answers || []).map((a) => {
                    const isCorrectAnswer = a.isCorrect != null
                      ? a.isCorrect
                      : a.answerId === item.correctAnswerId;
                    const isUserChoice = userSelectedIds.includes(a.answerId);
                    return (
                      <div
                        key={a.answerId}
                        className={cx('reviewAnswerOption', {
                          isCorrectAnswer: isCorrectAnswer,
                          isUserWrong: isUserChoice && !isCorrectAnswer,
                          isUserCorrect: isUserChoice && isCorrectAnswer,
                        })}
                      >
                        {a.answerText?.trim()
                          ? `${a.answerLabel ? `${a.answerLabel}. ` : ''}${a.answerText}`
                          : a.answerLabel}
                        {isCorrectAnswer && ' ✓'}
                        {isUserChoice && !isCorrectAnswer && ' (Bạn chọn)'}
                      </div>
                    );
                  })}
                </div>
                {item.explanation?.trim() && (
                  <div className={cx('reviewExplanation')}>
                    <strong>Giải thích:</strong> {item.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export default PlanResultView;
