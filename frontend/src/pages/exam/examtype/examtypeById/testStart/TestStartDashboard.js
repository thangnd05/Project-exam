import { IoInformationCircleOutline } from 'react-icons/io5';
import classNames from 'classnames/bind';
import styles from './TestStartPage.module.scss';

const cx = classNames.bind(styles);

function TestStartDashboard({
  allQuestions,
  userAnswers,
  onScrollToQuestion,
  columns, // số cột cố định cho lưới câu hỏi; bỏ trống = tự co (auto-fill).
}) {
  const gridStyle = columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : undefined;
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
              !!userAnswers[q.questionId]?.answerText;
            return (
              <button
                key={q.questionId}
                type="button"
                className={cx('q-nav-item', { answered: isAnswered })}
                onClick={() => onScrollToQuestion(q.questionId)}
                aria-label={`Câu ${idx + 1}${isAnswered ? ', đã làm' : ''}`}
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
