'use client';

import ReactDOM from 'react-dom';
import classNames from 'classnames/bind';
import { Trophy, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import styles from '@/app/features/learning-plans/PlanCongratsModal/PlanCongratsModal.module.scss';

const cx = classNames.bind(styles);

export const congratsSeenKey = (learningPlanId: string): string => `plan-congrats-seen-${learningPlanId}`;

export const markCongratsSeen = (learningPlanId: string): void => {
  try {
    localStorage.setItem(congratsSeenKey(learningPlanId), '1');
  } catch {}
};

const CONFETTI_COLORS = ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa', '#f87171'];
const CONFETTI_PIECES = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 100) / 18 + 2}%`,
  background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  animationDuration: `${2.4 + (i % 5) * 0.5}s`,
  animationDelay: `${(i % 7) * 0.35}s`,
}));

type PlanCongratsModalProps = {
  show?: boolean;
  onClose?: () => void;
  onNext?: () => void;
  totalTasks?: number | null;
  planSequence?: number | null;
};

function PlanCongratsModal({ show, onClose, onNext, totalTasks, planSequence }: PlanCongratsModalProps) {
  const t = useTranslations('LearningPlans');
  const tc = useTranslations('Common');
  if (!show) return null;

  return ReactDOM.createPortal(
    <div className={cx('overlay')} onClick={onClose} role="dialog" aria-modal="true">
      <div className={cx('card')} onClick={(e) => e.stopPropagation()}>
        <div className={cx('hero')}>
          {CONFETTI_PIECES.map((style, i) => (
            <span key={i} className={cx('confetti')} style={style} aria-hidden />
          ))}
          <ButtonPrime
            variant="onDark"
            size="icon"
            className={cx('closeBtn')}
            onClick={onClose}
            aria-label={tc('close')}
          >
            <X size={18} />
          </ButtonPrime>
          <div className={cx('trophyRing')}>
            <Trophy />
          </div>
          <h2 className={cx('heroTitle')}>{t('congrats.title')}</h2>
          <p className={cx('heroSub')}>
            {planSequence != null
              ? t('congrats.subtitleWithSequence', { sequence: planSequence })
              : t('congrats.subtitle')}
          </p>
        </div>

        <div className={cx('body')}>
          {totalTasks != null && (
            <span className={cx('progressPill')}>
              {t('congrats.progress', { total: totalTasks })}
            </span>
          )}

          <ul className={cx('nextSteps')}>
            <li className={cx('nextStep')}>
              <span className={cx('stepNum')}>1</span>
              <span className={cx('stepText')}>
                {t.rich('congrats.step1', { strong: (chunks) => <strong>{chunks}</strong> })}
              </span>
            </li>
            <li className={cx('nextStep')}>
              <span className={cx('stepNum')}>2</span>
              <span className={cx('stepText')}>
                {t.rich('congrats.step2', { strong: (chunks) => <strong>{chunks}</strong> })}
              </span>
            </li>
          </ul>

          <div className={cx('actions')}>
            <ButtonPrime variant="primary" onClick={onNext}>
              {t('common.nextStep')}
            </ButtonPrime>
            <ButtonPrime variant="outline" onClick={onClose}>
              {t('congrats.later')}
            </ButtonPrime>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default PlanCongratsModal;
