'use client';

import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import { Flame, CircleDollarSign } from 'lucide-react';

import BaseModal from '@/app/components/modal/BaseModal';
import { useStreak } from '@/app/features/gamification/streak/hooks/useStreak';
import { useCoins } from '@/app/features/gamification/coin/hooks/useCoins';
import { useRestoreStreak } from '@/app/features/gamification/streak/hooks/useRestoreStreak';
import styles from '@/app/features/gamification/streak/StreakRestoreModal.module.scss';

const cx = classNames.bind(styles);

type StreakRestoreModalProps = {
  show: boolean;
  onClose: () => void;
};

function StreakRestoreModal({ show, onClose }: StreakRestoreModalProps) {
  const { lostStreak, recoverCost } = useStreak();
  const { balance } = useCoins();
  const t = useTranslations('Gamification');
  const restoreMutation = useRestoreStreak();
  const busy = restoreMutation.isPending;

  const enough = balance >= recoverCost;

  const handleRestore = () => {
    restoreMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success(t('restore.success', { count: lostStreak }));
        onClose();
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || t('restore.error'));
      },
    });
  };

  return (
    <BaseModal
      show={show}
      onClose={busy ? undefined : onClose}
      title={t('restore.title')}
      maxWidth={420}
      footer={
        <>
          <button
            type="button"
            className={cx('cancelBtn')}
            onClick={onClose}
            disabled={busy}
          >
            {t('restore.later')}
          </button>
          <button
            type="button"
            className={cx('confirmBtn')}
            onClick={handleRestore}
            disabled={busy || !enough}
          >
            {busy ? t('restore.restoring') : enough ? t('restore.restore', { cost: recoverCost }) : t('restore.notEnough')}
          </button>
        </>
      }
    >
      <div className={cx('content')}>
        <div className={cx('flame')}>
          <Flame size={42} />
          <span className={cx('lost')}>{lostStreak}</span>
        </div>
        <p className={cx('lead')}>
          {t.rich('restore.lead', { count: lostStreak, strong: (chunks) => <strong>{chunks}</strong> })}
        </p>
        <div className={cx('rows')}>
          <div className={cx('row')}>
            <span>{t('restore.cost')}</span>
            <span className={cx('cost')}>
              <CircleDollarSign size={15} />
              {t('coins.amount', { amount: recoverCost })}
            </span>
          </div>
          <div className={cx('row')}>
            <span>{t('restore.balance')}</span>
            <span className={cx({ insufficient: !enough })}>
              <CircleDollarSign size={15} />
              {t('coins.amount', { amount: balance })}
            </span>
          </div>
        </div>
        {!enough && (
          <p className={cx('warn')}>{t('restore.warn')}</p>
        )}
      </div>
    </BaseModal>
  );
}

export default StreakRestoreModal;
