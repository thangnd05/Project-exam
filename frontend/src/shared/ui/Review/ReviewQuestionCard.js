'use client';

import classNames from 'classnames/bind';
import styles from '~/shared/styles/ReviewQuestions.module.scss';

const cx = classNames.bind(styles);

function ReviewQuestionCard({
  id,
  number,
  status,
  questionText,
  mode = 'options',
  answers = [],
  selectedAnswerIds = [],
  correctAnswerId,
  userAnswerText,
  correctAnswerText,
  explanation,
  canReview = true,
}) {
  return (
    <div id={id} className={cx('questionItem', status)}>
      <span className={cx('qText')}>
        <strong>{number ? `Câu ${number}:` : 'Câu hỏi:'}</strong> {questionText}
      </span>

      {mode === 'fill' ? (
        <div>
          <p className={cx('fillRow')}>
            <strong>Bạn trả lời:</strong> {userAnswerText || '(Chưa trả lời)'}
          </p>
          {canReview && correctAnswerText && (
            <p className={cx('fillRow')}>
              <strong>Đáp án đúng:</strong> {correctAnswerText}
            </p>
          )}
        </div>
      ) : (
        <div className={cx('answersOptions')}>
          {answers.map((a) => {
            const isCorrectAnswer =
              a.isCorrect != null
                ? !!a.isCorrect
                : correctAnswerId != null && a.answerId === correctAnswerId;
            const isUserChoice = selectedAnswerIds.includes(a.answerId);
            return (
              <div
                key={a.answerId}
                className={cx('answerOption', {
                  isCorrect: canReview && isCorrectAnswer,
                  isIncorrectChoice: isUserChoice && !isCorrectAnswer,
                  isUserChoice,
                })}
              >
                {a.answerText?.trim()
                  ? `${a.answerLabel ? `${a.answerLabel}. ` : ''}${a.answerText}`
                  : a.answerLabel}
                {isUserChoice && <span className={cx('userPill')}>(Bạn chọn)</span>}
              </div>
            );
          })}
        </div>
      )}

      {canReview && explanation?.trim() && (
        <div className={cx('explanationBox')}>
          <strong>Giải thích:</strong> {explanation}
        </div>
      )}
    </div>
  );
}

export default ReviewQuestionCard;
