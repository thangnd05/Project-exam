import { useNavigate } from 'react-router-dom';
import { IoCalendarOutline, IoFlagOutline } from 'react-icons/io5';
import classNames from 'classnames/bind';
import routes from '~/config/Routes';
import styles from './Result.module.scss';

const cx = classNames.bind(styles);

function RecoveryPlan({
  recoveryMessage,
  userTestId,
  examTypeId,
  hasTarget,
  isTargetMet,
  isGuest,
}) {
  const navigate = useNavigate();
  const canCreateTarget = !isGuest && !hasTarget && Boolean(examTypeId);
  const canCreatePlan = !isGuest && hasTarget && !isTargetMet;

  if (!recoveryMessage && !canCreateTarget && !canCreatePlan) return null;

  const handleGoToTarget = () => {
    const params = new URLSearchParams();
    if (examTypeId) params.set('examTypeId', String(examTypeId));
    navigate(`${routes.myTarget}?${params.toString()}`);
  };

  const handleGoToPlan = () => {
    const params = new URLSearchParams();
    if (userTestId) params.set('userTestId', userTestId);
    if (examTypeId) params.set('examTypeId', String(examTypeId));
    const qs = params.toString();
    navigate(qs ? `${routes.generatePlan}?${qs}` : routes.generatePlan);
  };

  return (
    <div className={cx('sectionContainer')}>
      <h3 className={cx('sectionTitle')} style={{ marginBottom: 4 }}>
        Việc cần làm ngay
      </h3>
      {recoveryMessage && (
        <p className={cx('recoveryMessage')}>{recoveryMessage}</p>
      )}
      {canCreateTarget && (
        <button
          type="button"
          className={cx('recoveryPlanCta', 'recoveryTargetCta')}
          onClick={handleGoToTarget}
        >
          <IoFlagOutline size={20} aria-hidden />
          Đặt mục tiêu
        </button>
      )}
      {canCreatePlan && (
        <button
          type="button"
          className={cx('recoveryPlanCta')}
          onClick={handleGoToPlan}
        >
          <IoCalendarOutline size={20} aria-hidden />
          Lập kế hoạch học
        </button>
      )}
    </div>
  );
}

export default RecoveryPlan;
