import classNames from 'classnames/bind';
import styles from './TestStartPage.module.scss';

const cx = classNames.bind(styles);

function TestStartDashboard({
  allQuestions,
  userAnswers,
  onScrollToQuestion,
  columns,
  isPaged = false,
  canNavigateToQuestion,
  currentQuestionIds = null,
  gridMaxHeight = null,
}) {
  const gridStyle =
    columns || gridMaxHeight
      ? {
          ...(columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : {}),
          ...(gridMaxHeight ? { maxHeight: gridMaxHeight, overflowY: 'auto' } : {}),
        }
      : undefined;
  return (
    <div className={cx('dashboard')}>
      <div className={cx('dashboard-card')}>
        <div className={cx('dashboard-header')}>
          <span>Danh sách câu hỏi</span>
        </div>
        <div className={cx('question-grid')} style={gridStyle}>
          {allQuestions.map((q, idx) => {
            const isAnswered =
              !!userAnswers[q.questionId]?.selectedAnswerId ||
              (Array.isArray(userAnswers[q.questionId]?.selectedAnswerIds) &&
                userAnswers[q.questionId].selectedAnswerIds.length > 0) ||
              !!userAnswers[q.questionId]?.answerText;

            const locked =
              isPaged && typeof canNavigateToQuestion === 'function'
                ? !canNavigateToQuestion(q.questionId)
                : false;
            const isCurrent = currentQuestionIds ? currentQuestionIds.has(q.questionId) : false;
            return (
              <button
                key={q.questionId}
                type="button"
                className={cx('q-nav-item', { answered: isAnswered, current: isCurrent, locked })}
                onClick={() => !locked && onScrollToQuestion(q.questionId)}
                disabled={locked}
                aria-current={isCurrent ? 'true' : undefined}
                aria-label={`Câu ${idx + 1}${isAnswered ? ', đã làm' : ''}${locked ? ', đang khoá' : ''}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
        <div className={cx('dashboard-footer')}>
          <div className={cx('status-item')}>
            <span className={cx('dot', 'answered')} />
            <span>Đã làm</span>
          </div>
          <div className={cx('status-item')}>
            <span className={cx('dot')} />
            <span>Chưa làm</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestStartDashboard;
