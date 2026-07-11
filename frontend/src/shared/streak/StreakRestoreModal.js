import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import { Flame, CircleDollarSign } from 'lucide-react';

import BaseModal from '~/shared/ui/modal/BaseModal';
import { useStreak } from '~/shared/hooks/useStreak';
import { useCoins } from '~/shared/hooks/useCoins';
import { useRestoreStreak } from '~/shared/streak/useRestoreStreak';
import styles from './StreakRestoreModal.module.scss';

const cx = classNames.bind(styles);

function StreakRestoreModal({ show, onClose }) {
  const { lostStreak, recoverCost } = useStreak();
  const { balance } = useCoins();
  const restoreMutation = useRestoreStreak();
  const busy = restoreMutation.isPending;

  const enough = balance >= recoverCost;

  const handleRestore = () => {
    restoreMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success(`Đã khôi phục chuỗi ${lostStreak} ngày! 🔥`);
        onClose();
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || 'Khôi phục thất bại. Vui lòng thử lại.');
      },
    });
  };

  return (
    <BaseModal
      show={show}
      onClose={busy ? undefined : onClose}
      title="Khôi phục chuỗi"
      maxWidth={420}
      footer={
        <>
          <button
            type="button"
            className={cx('cancelBtn')}
            onClick={onClose}
            disabled={busy}
          >
            Để sau
          </button>
          <button
            type="button"
            className={cx('confirmBtn')}
            onClick={handleRestore}
            disabled={busy || !enough}
          >
            {busy ? 'Đang khôi phục...' : enough ? `Khôi phục (${recoverCost} xu)` : 'Không đủ xu'}
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
          Bạn vừa làm đứt chuỗi <strong>{lostStreak} ngày</strong>. Dùng xu để nối lại
          và tiếp tục từ đúng số ngày đã mất.
        </p>
        <div className={cx('rows')}>
          <div className={cx('row')}>
            <span>Chi phí khôi phục</span>
            <span className={cx('cost')}>
              <CircleDollarSign size={15} />
              {recoverCost} xu
            </span>
          </div>
          <div className={cx('row')}>
            <span>Số dư của bạn</span>
            <span className={cx({ insufficient: !enough })}>
              <CircleDollarSign size={15} />
              {balance} xu
            </span>
          </div>
        </div>
        {!enough && (
          <p className={cx('warn')}>Bạn không đủ xu để khôi phục. Hãy làm nhiệm vụ để kiếm thêm xu.</p>
        )}
      </div>
    </BaseModal>
  );
}

export default StreakRestoreModal;
