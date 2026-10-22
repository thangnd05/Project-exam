'use client';

import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import styles from '@/app/assets/styles/ReviewQuestions.module.scss';

const cx = classNames.bind(styles);

type ReviewAnswer = {
  answerId: string;
  answerText?: string;
  answerLabel?: string;
  /** Không có thì so với correctAnswerId. */
  isCorrect?: boolean | null;
};

type ReviewQuestionCardProps = {
  id?: string;
  number?: number;
  status?: string;
  questionText?: React.ReactNode;
  mode?: 'options' | 'fill';
  answers?: ReviewAnswer[];
  selectedAnswerIds?: string[];
  correctAnswerId?: string | null;
  userAnswerText?: string;
  correctAnswerText?: string;
  explanation?: string;
  canReview?: boolean;
};

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
}: ReviewQuestionCardProps) {
  const t = useTranslations('TestTaking.review');
  return (
    <div id={id} className={cx('questionItem', status)}>
      <span className={cx('qText')}>
        <strong>{number ? t('questionNumber', { number }) : t('questionPrefix')}</strong> {questionText}
      </span>

      {mode === 'fill' ? (
        <div>
          <p className={cx('fillRow')}>
            <strong>{t('yourAnswer')}</strong> {userAnswerText || t('noAnswer')}
          </p>
          {canReview && correctAnswerText && (
            <p className={cx('fillRow')}>
              <strong>{t('correctAnswer')}</strong> {correctAnswerText}
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
                {isUserChoice && <span className={cx('userPill')}>{t('yourChoice')}</span>}
              </div>
            );
          })}
        </div>
      )}

      {canReview && explanation?.trim() && (
        <div className={cx('explanationBox')}>
          <strong>{t('explanation')}</strong> {explanation}
        </div>
      )}
    </div>
  );
}

export default ReviewQuestionCard;
